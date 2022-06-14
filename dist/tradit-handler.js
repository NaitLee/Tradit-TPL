"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Handler = exports.ReadableForMacros = void 0;
const events_1 = require("events");
const stream_1 = require("stream");
const tradit_globals_1 = require("./tradit-globals");
const tradit_assemblizer_1 = require("./tradit-assemblizer");
const tradit_constants_1 = require("./tradit-constants");
const tradit_interpreter_1 = require("./tradit-interpreter");
const tradit_serializer_1 = require("./tradit-serializer");
const tradit_misc_1 = require("./tradit-misc");
class ReadableForMacros extends stream_1.Readable {
    constructor(options) {
        super(options);
        this.ctx = options.ctx;
    }
    async put(item) {
        // Note: this is useless. Will find a better solution
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
    constructor() {
        this.interpreter = null;
        this.unsubscribers = [];
        let path = tradit_globals_1.API.getConfig(tradit_constants_1.CFG_KEY_PATH);
        path = (0, tradit_misc_1.makePathConsistent)(path); // i have edge case: dev on *nix but test with wine
        if (!path.includes(tradit_constants_1.PATH_DELIM))
            path = tradit_constants_1.PLUGIN_PATH + path;
        tradit_globals_1.API.setConfig(tradit_constants_1.CFG_KEY_PATH, path);
        this.unsubscribers.push(tradit_globals_1.API.subscribeConfig(tradit_constants_1.CFG_KEY_PATH, this.loadTemplate.bind(this)));
    }
    loadTemplate(path) {
        if (path.endsWith(tradit_constants_1.PATH_DELIM)) {
            let possible_tpls = tradit_globals_1.HFS.fs.readdirSync(path).filter(s => s.endsWith('.tpl'));
            if (possible_tpls.length > 0) {
                path += possible_tpls[0];
                tradit_globals_1.API.setConfig(tradit_constants_1.CFG_KEY_PATH, path);
                return; // let subscriber work
            }
            else {
                tradit_globals_1.API.log('Please manually select a template in plugin configuration');
                return;
            }
        }
        let debug_dump = tradit_globals_1.Debug & tradit_constants_1.DebugFlags.DumpTpl;
        tradit_globals_1.HFS.fs.readFile(path, {
            encoding: 'utf-8'
        }, (err, data) => {
            if (err) {
                tradit_globals_1.API.log(`can't load template: ${err}`);
                return;
            }
            let serialized = (0, tradit_serializer_1.serialize)(data);
            let template = (0, tradit_assemblizer_1.assemblize)(serialized);
            if (debug_dump) {
                tradit_globals_1.HFS.fs.writeFileSync(path + '.s.json', JSON.stringify(serialized, void 0, 4), 'utf-8');
                tradit_globals_1.HFS.fs.writeFileSync(path + '.a.json', JSON.stringify(template, void 0, 4), 'utf-8');
            }
            this.interpreter = new tradit_interpreter_1.Interpreter(template, tradit_globals_1.API);
            tradit_globals_1.API.log(`using template '${path}'`);
            tradit_globals_1.API.log(`Ready`);
        });
    }
    async handle(ctx) {
        if (!this.interpreter)
            return;
        if (!ctx.path.endsWith('/') && // file serving is by HFS
            !ctx.path.startsWith(tradit_constants_1.SECTION_URI) // HFS special uris are filtered in plugin.ts
        )
            return;
        let section_name = ctx.path.startsWith(tradit_constants_1.SECTION_URI) ? ctx.path.slice(2) : '';
        let id = this.interpreter.getSectionIndex(section_name);
        let allow_private_section = false;
        let readable_list = null;
        readable_list =
            (this.interpreter.template.params[id].no_list || section_name !== '')
                ? null
                : await tradit_globals_1.HFS.file_list({ path: ctx.path, omit: 'c', sse: true }, ctx);
        do { // for good code by early break
            if (readable_list === null)
                break;
            await (0, events_1.once)(readable_list, 'readable');
            let possible_error = readable_list.read();
            if (possible_error === null)
                break; // TODO: is this possible?
            if (possible_error.error === undefined) {
                readable_list.unshift(possible_error); // not an error
                break;
            }
            switch (ctx.status = possible_error.error) {
                case tradit_globals_1.API.const.UNAUTHORIZED:
                    section_name = 'unauth';
                    break;
                case tradit_globals_1.API.const.FORBIDDEN:
                    section_name = 'forbidden';
                    break;
                case 400:
                    // bad request
                    return;
                case 418:
                    // potential attack, or tea pot
                    return true;
                default:
                    section_name = 'not found';
            }
            readable_list = null;
            allow_private_section = true;
        } while (false);
        if (!this.interpreter.hasSection(section_name, allow_private_section)) {
            ctx.status = 404;
            section_name = 'not found';
        }
        if (!this.interpreter.hasSection(section_name, allow_private_section))
            return;
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
        generator = this.interpreter.getSectionGenerator(section_name, readable, readable_list, allow_private_section);
        if (!generator)
            return;
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
exports.Handler = Handler;
//# sourceMappingURL=tradit-handler.js.map