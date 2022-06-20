"use strict";
///<reference path="./types.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const tradit_constants_1 = require("./tradit-constants");
const tradit_handler_1 = require("./tradit-handler");
const tradit_globals_1 = require("./tradit-globals");
exports.description = "Use an HFS 2 'template' in HFS 3 - PRE-ALPHA stage";
exports.version = 1;
exports.apiRequired = 4;
exports.config = {
    [tradit_constants_1.CFG_KEY_PATH]: {
        type: 'real_path',
        label: 'Template',
        helperText: 'Path to template file',
        defaultValue: tradit_constants_1.PLUGIN_PATH,
        defaultPath: tradit_constants_1.PLUGIN_PATH,
        fileMask: '*.tpl'
    },
    [tradit_constants_1.CFG_KEY_DEBUG]: {
        type: 'number',
        label: 'Debug Flag',
        helperText: 'For developers only',
        defaultValue: 0
    }
};
exports.init = async function (api) {
    try {
        (0, tradit_globals_1.globalInit)(exports, api);
        // let module = await WebAssembly.compile(readFileSync(WASM_PATH));
        const handler = new tradit_handler_1.Handler();
        return {
            middleware: async function (ctx) {
                if (ctx.path.startsWith(api.const.SPECIAL_URI))
                    return;
                return await handler.handle(ctx);
            },
            unload: async function () {
                handler.unload();
            }
        };
    }
    catch (error) {
        api.log(`Load failed - ${error}`);
        return {};
    }
};
//# sourceMappingURL=plugin.js.map