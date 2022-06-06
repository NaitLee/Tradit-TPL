
///<reference path="./types.d.ts" />

import { PLUGIN_PATH } from './tradit-constants';
import { Handler } from './tradit-handler';

declare var exports: HFSPlugin;

exports.description = "Use an HFS 2 'template' in HFS 3 - PRE-ALPHA stage";
exports.version = 1;
exports.apiRequired = 3;

exports.config = {
    path: {
        type: 'real_path',
        label: 'Template',
        helperText: 'Path to template file',
        defaultValue: PLUGIN_PATH,
        defaultPath: '__dirname',
        fileMask: '*.tpl'
    },
    debug: {
        type: 'number',
        label: 'Debug Flag',
        helperText: 'For developers only',
        defaultValue: 0
    }
};

exports.init = function(api) {
    const handler = new Handler(exports, api);
    return {
        middleware: async function(ctx) {
            if (ctx.path.startsWith(api.const.SPECIAL_URI)) return;
            return await handler.handle(ctx);
        }
    };
}
