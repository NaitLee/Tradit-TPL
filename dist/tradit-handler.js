"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Handler = exports.ReadableForMacros = void 0;
const stream_1 = require("stream");
const tradit_assemblizer_1 = require("./tradit-assemblizer");
const tradit_serializer_1 = require("./tradit-serializer");
const tradit_constants_1 = require("./tradit-constants");
const tradit_interpreter_1 = require("./tradit-interpreter");
const events_1 = require("events");
var HFS;
class ReadableForMacros extends stream_1.Readable {
    constructor(options) {
        super(options);
        this.ctx = options.ctx;
    }
    async put(item) {
        if (!this.push(item)) {
            await (0, events_1.once)(this, 'readable');
        }
    }
}
exports.ReadableForMacros = ReadableForMacros;
function mimetype(path) {
    let suffix = path.split('.').at(-1) ?? 'html';
    return tradit_constants_1.Mimetype[suffix] ?? tradit_constants_1.Mimetype['html'];
}
class Handler {
    constructor(plugin, api) {
        this.plugin = plugin;
        this.api = api;
        HFS = {
            file_list: api.require('./api.file_list').file_list,
            fs: api.require('fs')
        };
        let path = api.getConfig('path');
        let is_debug = api.getConfig('debug') & tradit_constants_1.DebugFlags.Debug;
        if (!path.includes('/'))
            path = tradit_constants_1.PLUGIN_PATH + path;
        HFS.fs.readFile(path, {
            encoding: 'utf-8'
        }, (err, data) => {
            if (err) {
                api.log(`can't load template: ${err}`);
                return;
            }
            let serialized = (0, tradit_serializer_1.serialize)(data);
            let template = (0, tradit_assemblizer_1.assemblize)(serialized);
            if (is_debug) {
                HFS.fs.writeFileSync(path + '.s.json', JSON.stringify(serialized, void 0, 4), 'utf-8');
                HFS.fs.writeFileSync(path + '.a.json', JSON.stringify(template, void 0, 4), 'utf-8');
            }
            this.interpreter = new tradit_interpreter_1.Interpreter(template, api);
            api.log(`using template '${path}'`);
            api.log(`Ready`);
        });
        this.interpreter = null;
    }
    async handle(ctx) {
        if (!this.interpreter)
            return;
        if (!ctx.path.endsWith('/') && !(ctx.path.startsWith('/~') && !ctx.path.startsWith('/~/')))
            return;
        let section_name = ctx.path.startsWith('/~') ? ctx.path.slice(2) : '';
        let id = this.interpreter.getSectionIndex(section_name);
        let entry_generator = null;
        entry_generator =
            this.interpreter.template.params[id].no_list || section_name
                ? null
                : await HFS.file_list({ path: ctx.path, omit: 'c', sse: true }, ctx);
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
        if (!this.interpreter.hasSection(section_name))
            return void (ctx.body = 'not found');
        let generator;
        const step = 64;
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
        generator = this.interpreter.getSectionGenerator(section_name, readable, entry_generator);
        if (!generator)
            return void (ctx.body = 'not found');
        ctx.status = 200;
        ctx.type = mimetype(ctx.path);
        ctx.body = readable;
        return true;
    }
}
exports.Handler = Handler;
//# sourceMappingURL=tradit-handler.js.map