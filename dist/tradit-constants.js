"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackType = exports.ItemRole = exports.DebugFlags = exports.Mimetype = exports.MacroMarker = exports.NULL_INT = exports.NULL_STRING = exports.NULL_NUMBER = exports.SECTION_URI = exports.CFG_KEY_DEBUG = exports.CFG_KEY_PATH = exports.WASM_PATH = exports.PLUGIN_PATH = exports.PATH_DELIM = void 0;
exports.PATH_DELIM = process.platform === 'win32' ? '\\' : '/';
exports.PLUGIN_PATH = __dirname + exports.PATH_DELIM;
exports.WASM_PATH = exports.PLUGIN_PATH + 'tradit-wasm.wasm';
exports.CFG_KEY_PATH = 'path';
exports.CFG_KEY_DEBUG = 'debug';
exports.SECTION_URI = '/~';
exports.NULL_NUMBER = NaN;
exports.NULL_STRING = '\x00';
exports.NULL_INT = -1;
exports.MacroMarker = {
    Open: '{.',
    Close: '.}',
    Sep: '|',
    Quote: '{:',
    Dequote: ':}',
    Sym: '%'
};
/**
 * We serve only pages, not files.
 * Don't put too much here.
 */
exports.Mimetype = {
    'html': 'text/html',
    'json': 'text/json',
    'css': 'text/css',
    'js': 'text/javascript',
    'txt': 'text/plain',
    'bin': 'application/octet-stream'
};
var DebugFlags;
(function (DebugFlags) {
    DebugFlags[DebugFlags["Verbose"] = 1] = "Verbose";
    DebugFlags[DebugFlags["DumpTpl"] = 2] = "DumpTpl";
})(DebugFlags = exports.DebugFlags || (exports.DebugFlags = {}));
var ItemRole;
(function (ItemRole) {
    ItemRole[ItemRole["Plain"] = 1] = "Plain";
    ItemRole[ItemRole["Group"] = 2] = "Group";
    ItemRole[ItemRole["PopCount"] = 4] = "PopCount";
    ItemRole[ItemRole["Pop"] = 8] = "Pop";
    ItemRole[ItemRole["Static"] = 16] = "Static";
})(ItemRole = exports.ItemRole || (exports.ItemRole = {}));
var StackType;
(function (StackType) {
    StackType[StackType["Number"] = 0] = "Number";
    StackType[StackType["String"] = 1] = "String";
    StackType[StackType["Group"] = 2] = "Group";
})(StackType = exports.StackType || (exports.StackType = {}));
//# sourceMappingURL=tradit-constants.js.map