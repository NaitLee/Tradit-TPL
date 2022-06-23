
import { once } from 'events';
import { Readable, ReadableOptions } from 'stream';
import { API, HFS, Locales, Log, Unsubscribers } from './tradit-globals';
import { CFG_KEY_LANG, CFG_KEY_PATH, DEF_LANG, Mimetype, PATH_DELIM, PLUGIN_PATH, SECTION_URI } from './tradit-constants';
import { Interpreter } from './tradit-interpreter';
import { unifyTemplate } from './tradit-unifier';
import { makePathConsistent } from './tradit-misc';

// Note: Incomplete
export interface SendListReadable extends Readable {
    [Symbol.asyncIterator](): AsyncIterableIterator<SendListEntry<FileEntry>>;
    read(size?: number): SendListEntry<FileEntry>;
    getLastError(): number | undefined;
}

export class ReadableForMacros extends Readable {
    ctx: KoaContext;
    constructor(options: ReadableOptions & { ctx: KoaContext }) {
        super(options);
        this.ctx = options.ctx;
    }
    async put(item: any) {
        this.push(item);
        // Note: this is useless. Will find a better solution
        // if (!this.push(item)) {
        //     await once(this, 'readable');
        // }
    }
}

function mimetype(path: string) {
    let suffix = path.split('.').at(-1) ?? 'html';
    return Mimetype[suffix] ?? Mimetype['html'];
}

export class Handler {
    interpreter: Interpreter | null;
    private languageBeingSet: boolean;
    constructor() {
        this.interpreter = null;
        this.languageBeingSet = API.getConfig(CFG_KEY_LANG) !== '';
        let path: string = API.getConfig(CFG_KEY_PATH);
        path = makePathConsistent(path); // i have edge case: dev on *nix but test with wine
        if (!path.includes(PATH_DELIM)) path = PLUGIN_PATH + path;
        API.setConfig(CFG_KEY_PATH, path);
        Unsubscribers.push(
            API.subscribeConfig(CFG_KEY_PATH, this.loadTemplate.bind(this))
        );
    }
    loadTemplate(path: string) {
        if (path.endsWith(PATH_DELIM)) {
            let possible_tpls = HFS.fs.readdirSync(path).filter(s => s.endsWith('.tpl'));
            if (possible_tpls.length > 0) {
                path += possible_tpls[0];
                API.setConfig(CFG_KEY_PATH, path);
                return; // let subscriber work
            } else {
                Log.note('please-manually-select-a-template-in-plugin-configuration');
                return;
            }
        }
        HFS.fs.readFile(path, {
            encoding: 'utf-8'
        }, (error, data) => {
            if (error) {
                Log.warn('cant-load-template-0-1', [path, error]);
                return;
            }
            let template = unifyTemplate(data);
            this.interpreter = new Interpreter(template, API);
            Log.log('using-template-0', [path]);
            Log.log('ready');
        });
    }
    async handle(ctx: KoaContext) {
        if (!this.interpreter) return;
        if (ctx.path.startsWith(API.const.SPECIAL_URI)) {
            if (!this.languageBeingSet) {
                let best = ctx.acceptsLanguages(Locales.supported) || DEF_LANG;
                API.setConfig(CFG_KEY_LANG, best);
                this.languageBeingSet = true;
            }
            return;
        }
        if (
            !ctx.path.endsWith('/') && // file serving is by HFS
            !ctx.path.startsWith(SECTION_URI) // HFS special uris are filtered in plugin.ts
        ) return;
        let section_name = ctx.path.startsWith(SECTION_URI) ? ctx.path.slice(2) : '';
        let id = this.interpreter.getSectionIndex(section_name);
        let allow_private_section = false;
        let readable_list: SendListReadable | null = null;
        readable_list =
            (this.interpreter.template.params[id].no_list || section_name !== '')
                ? null
                : await HFS.file_list<SendListReadable>(
                      { path: ctx.path, omit: 'c', sse: true },
                      ctx
                  );
        do { // for good code by early break
            if (readable_list === null) break;
            await once(readable_list, 'readable');
            let possible_error = readable_list.getLastError();
            if (possible_error === undefined) break;
            switch (ctx.status = possible_error) {
                case 418:
                    // potential attack, or tea pot
                    return true;
                case 404:
                    section_name = 'not found';
                    break;
                case API.const.UNAUTHORIZED:
                    section_name = 'unauth';
                    break;
                case API.const.FORBIDDEN:
                    section_name = 'forbidden';
                    break;
                default:
                    return;
            }
            readable_list = null;
            allow_private_section = true;
        } while (false);
        if (!this.interpreter.hasSection(section_name, allow_private_section)) return;
        let generator: AsyncGenerator<boolean>;
        const step: number = 64;
        let readable = new ReadableForMacros({
            async read() {
                for (let i = 0; i < step; i++) {
                    if (!(await generator.next()).value) {
                        this.push(null);
                        return;
                    }
                }
            },
            ctx: ctx
        });
        generator = this.interpreter.getSectionGenerator(
            section_name,
            readable,
            readable_list,
            allow_private_section
        ) as AsyncGenerator<boolean>;
        if (!generator) return;
        ctx.status = 200;
        ctx.type = mimetype(ctx.path);
        ctx.body = readable;
        return true;
    }
}
