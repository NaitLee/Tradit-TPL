"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalInit = exports.Debug = exports.API = exports.Plugin = exports.HFS = void 0;
const tradit_constants_1 = require("./tradit-constants");
function globalInit(plugin, api) {
    exports.Plugin = plugin;
    exports.API = api;
    exports.Debug = api.getConfig(tradit_constants_1.CFG_KEY_DEBUG);
    exports.HFS = {
        file_list: api.require('./api.file_list').file_list,
        fs: api.require('fs')
    };
}
exports.globalInit = globalInit;
//# sourceMappingURL=tradit-globals.js.map