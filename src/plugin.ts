
///<reference path="./types.d.ts" />

import { CFG_KEY_DEBUG, CFG_KEY_LANG, CFG_KEY_PATH, PLUGIN_PATH } from './tradit-constants';
import { Handler } from './tradit-handler';
import { globalInit, Log, Unsubscribers } from './tradit-globals';
import { i18n } from './i18n';

declare var exports: HFSPlugin;

exports.description = "Use an HFS 2 'template' in HFS 3";
exports.version = 1;
exports.apiRequired = 4;

exports.init = async function(api) {
    try {
        await globalInit(exports, api);
        // let module = await WebAssembly.compile(readFileSync(WASM_PATH));
        const handler = new Handler();
        return {
            middleware: async function(ctx) {
                return await handler.handle(ctx);
            },
            unload: async function() {
                Unsubscribers.forEach(u => u());
                Unsubscribers.length = 0;
            },
            description: i18n('use-an-hfs-2-template-in-hfs-3'),
            config: {
                [CFG_KEY_PATH]: {
                    type: 'real_path',
                    label: i18n('template'),
                    helperText: i18n('path-to-template-file'),
                    defaultValue: PLUGIN_PATH,
                    defaultPath: PLUGIN_PATH,
                    fileMask: '*.tpl'
                },
                [CFG_KEY_LANG]: {
                    type: 'string',
                    label: i18n('language'),
                    helperText: i18n('language-code-eg-en-us'),
                    defaultValue: ''
                },
                [CFG_KEY_DEBUG]: {
                    type: 'number',
                    label: i18n('debug-flag'),
                    helperText: i18n('for-developers-only'),
                    defaultValue: 0
                }
            }
        };
    } catch(error) {
        Log.error('tradit-tpl-error-0', [error]);
        return {};
    }
}
