
///<reference path="./types.d.ts" />

import { CFG_KEY_DEBUG, CFG_KEY_PATH, PLUGIN_PATH, WASM_PATH } from './tradit-constants';
import { Handler } from './tradit-handler';
import { globalInit } from './tradit-globals';
import { instantiate } from './tradit-wasm';
import { readFileSync } from 'fs';

declare var exports: HFSPlugin;

exports.description = "Use an HFS 2 'template' in HFS 3 - PRE-ALPHA stage";
exports.version = 1;
exports.apiRequired = 4;

exports.config = {
    [CFG_KEY_PATH]: {
        type: 'real_path',
        label: 'Template',
        helperText: 'Path to template file',
        defaultValue: PLUGIN_PATH,
        defaultPath: PLUGIN_PATH,
        fileMask: '*.tpl'
    },
    [CFG_KEY_DEBUG]: {
        type: 'number',
        label: 'Debug Flag',
        helperText: 'For developers only',
        defaultValue: 0
    }
};

exports.init = async function(api) {
    try {
        globalInit(exports, api);
        // let module = await WebAssembly.compile(readFileSync(WASM_PATH));
        const handler = new Handler();
        return {
            middleware: async function(ctx) {
                if (ctx.path.startsWith(api.const.SPECIAL_URI)) return;
                return await handler.handle(ctx);
            },
            unload: async function() {
                handler.unload();
            }
        };
    } catch(error) {
        api.log(`Load failed - ${error}`);
        return {};
    }
}
