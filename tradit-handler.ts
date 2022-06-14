
import { once } from 'events';
import { Readable, ReadableOptions } from 'stream';
import { API, Debug, HFS } from './tradit-globals';
import { assemblize } from './tradit-assemblizer';
import { CFG_KEY_PATH, DebugFlags, Mimetype, PATH_DELIM, PLUGIN_PATH, SECTION_URI } from './tradit-constants';
import { Interpreter } from './tradit-interpreter';
import { serialize } from './tradit-serializer';
import { makePathConsistent } from './tradit-misc';

export class ReadableForMacros extends Readable {
    ctx: KoaContext;
    constructor(options: ReadableOptions & { ctx: KoaContext }) {
        super(options);
        this.ctx = options.ctx;
    }
    async put(item: any) {
        if (!this.push(item)) {
            await once(this, 'readable');
        }
    }
}

function mimetype(path: string) {
    let suffix = path.split('.').at(-1) ?? 'html';
    return Mimetype[suffix] ?? Mimetype['html'];
}

export class Handler {
    interpreter: Interpreter | null;
    unsubscribers: Unsubscriber[];
    constructor() {
        this.interpreter = null;
        this.unsubscribers = [];
        let path: string = API.getConfig(CFG_KEY_PATH);
        path = makePathConsistent(path); // i have edge case: dev on *nix but test with wine
        if (!path.includes(PATH_DELIM)) path = PLUGIN_PATH + path;
        API.setConfig(CFG_KEY_PATH, path);
        this.unsubscribers.push(
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
                API.log('Please select a template in plugin configuration');
                return;
            }
        }
        let debug_dump = Debug & DebugFlags.DumpTpl;
        HFS.fs.readFile(path, {
            encoding: 'utf-8'
        }, (err, data) => {
            if (err) {
                API.log(`can't load template: ${err}`);
                return;
            }
            let serialized = serialize(data);
            let template = assemblize(serialized);
            if (debug_dump) {
                HFS.fs.writeFileSync(path + '.s.json', JSON.stringify(serialized, void 0, 4), 'utf-8');
                HFS.fs.writeFileSync(path + '.a.json', JSON.stringify(template, void 0, 4), 'utf-8');
            }
            this.interpreter = new Interpreter(template, API);
            API.log(`using template '${path}'`);
            API.log(`Ready`);
        });
    }
    async handle(ctx: KoaContext) {
        if (!this.interpreter) return;
        if (
            !ctx.path.endsWith('/') && // file serving is by HFS
            !ctx.path.startsWith(SECTION_URI) // HFS special uris are filtered in plugin.ts
        ) return;
        let section_name = ctx.path.startsWith(SECTION_URI) ? ctx.path.slice(2) : '';
        let id = this.interpreter.getSectionIndex(section_name);
        let entry_generator: FileEntryGenerator | APIError | null = null;
        entry_generator =
            this.interpreter.template.params[id].no_list || section_name
                ? null
                : await HFS.file_list<FileEntryGenerator>(
                      { path: ctx.path, omit: 'c', sse: true },
                      ctx
                  );
        if (entry_generator instanceof Error) {
            switch (ctx.status = entry_generator.status) {
                case 404:
                    section_name = 'not found';
                    break;
                case 401:
                    section_name = 'unauth';
                    break;
                case 403:
                    section_name = 'forbidden';
                    break;
                case 400:
                    // section_name = 'bad request';
                    section_name = 'not found';
                    break;
                case 418:
                    return;
            }
            entry_generator = null;
        }
        if (!this.interpreter.hasSection(section_name)) {
            ctx.status = 404;
            section_name = 'not found';
        }
        if (!this.interpreter.hasSection(section_name)) return void(ctx.body = 'not found');
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
        generator = this.interpreter.getSectionGenerator(section_name, readable, entry_generator) as AsyncGenerator<boolean>;
        if (!generator) return void(ctx.body = 'not found');
        ctx.status = 200;
        ctx.type = mimetype(ctx.path);
        ctx.body = readable;
        return true;
    }
    unload() {
        this.unsubscribers.forEach(f => f());
        this.unsubscribers.length = 0;
    }
}
