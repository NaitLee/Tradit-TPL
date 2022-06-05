"use strict";
///<reference path="./types.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const tradit_constants_1 = require("./tradit-constants");
const tradit_handler_1 = require("./tradit-handler");
exports.description = "Use an HFS 2 'template' in HFS 3 - PRE-ALPHA stage";
exports.version = 1;
exports.apiRequired = 3;
exports.config = {
    path: {
        type: 'real_path',
        label: 'Template',
        helperText: 'Path to template file',
        defaultValue: tradit_constants_1.PLUGIN_PATH
    },
    debug: {
        type: 'number',
        label: 'Debug Flag',
        helperText: 'For developers only',
        defaultValue: 0
    }
};
exports.init = function (api) {
    const handler = new tradit_handler_1.Handler(exports, api);
    return {
        middleware: async function (ctx) {
            if (ctx.path.startsWith('/~/'))
                return;
            return await handler.handle(ctx);
        }
    };
};
//# sourceMappingURL=plugin.js.map