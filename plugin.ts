
///<reference path="./types.d.ts" />

import { CFG_KEY_DEBUG, CFG_KEY_PATH, PLUGIN_PATH } from './tradit-constants';
import { Handler } from './tradit-handler';
import { init } from './tradit-globals';

declare var exports: HFSPlugin;

exports.description = "Use an HFS 2 'template' in HFS 3 - PRE-ALPHA stage";
exports.version = 1;
exports.apiRequired = 3;

exports.config = {
    [CFG_KEY_PATH]: {
        type: 'real_path',
        label: 'Template',
        helperText: 'Path to template file',
        defaultValue: PLUGIN_PATH,
        defaultPath: '__dirname',
        fileMask: '*.tpl'
    },
    [CFG_KEY_DEBUG]: {
        type: 'number',
        label: 'Debug Flag',
        helperText: 'For developers only',
        defaultValue: 0
    }
};

exports.init = function(api) {
    init(exports, api);
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
}
