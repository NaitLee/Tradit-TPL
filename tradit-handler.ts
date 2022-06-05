
import * as fs from 'fs';
import { Readable, ReadableOptions } from 'stream';
import { assemblize } from './tradit-assemblizer';
import { serialize } from './tradit-serializer';
import { DebugFlags, Mimetype, PLUGIN_PATH } from './tradit-constants';
import { Interpreter } from './tradit-interpreter';
import { once } from 'events';

var HFS: HFS<typeof fs>;

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
    constructor(public plugin: HFSPlugin, public api: HFSAPI) {
        HFS = {
            file_list: api.require('./api.file_list').file_list,
            fs: api.require('fs')
        };
        let path: string = api.getConfig('path');
        let is_debug = api.getConfig('debug') & DebugFlags.Debug;
        if (!path.includes('/')) path = PLUGIN_PATH + path;
        HFS.fs.readFile(path, {
            encoding: 'utf-8'
        }, (err, data) => {
            if (err) {
                api.log(`can't load template: ${err}`);
                return;
            }
            let serialized = serialize(data);
            let template = assemblize(serialized);
            if (is_debug) {
                HFS.fs.writeFileSync(path + '.s.json', JSON.stringify(serialized, void 0, 4), 'utf-8');
                HFS.fs.writeFileSync(path + '.a.json', JSON.stringify(template, void 0, 4), 'utf-8');
            }
            this.interpreter = new Interpreter(template, api);
            api.log(`using template '${path}'`);
            api.log(`Ready`);
        });
        this.interpreter = null;
    }
    async handle(ctx: KoaContext) {
        if (!this.interpreter) return;
        if (!ctx.path.endsWith('/') && !(ctx.path.startsWith('/~') && !ctx.path.startsWith('/~/'))) return;
        let section_name = ctx.path.startsWith('/~') ? ctx.path.slice(2) : '';
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
}
