
export const PATH_DELIM = process.platform === 'win32' ? '\\' : '/';
export const PLUGIN_PATH = __dirname + PATH_DELIM;
export const WASM_PATH = PLUGIN_PATH + 'tradit-wasm.wasm';
export const CFG_KEY_PATH = 'path';
export const CFG_KEY_DEBUG = 'debug';
export const CFG_KEY_LANG = 'language';
export const DEF_LANG = 'en-US';
export const SECTION_URI = '/~';
export const NULL_NUMBER = NaN;
export const NULL_STRING = '\x00';
export const NULL_INT = -1;

export const MacroMarker = {
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
export const Mimetype: {
    [suffix: string]: string
} = {
    'html': 'text/html',
    'json': 'text/json',
    'css': 'text/css',
    'js': 'text/javascript',
    'txt': 'text/plain',
    'bin': 'application/octet-stream'
};

export enum DebugFlags {
    Verbose = 1 << 0,
    DumpTpl = 1 << 1,
}

export enum ItemRole {
    Plain = 1 << 0,
    Group = 1 << 1,
    PopCount = 1 << 2,
    Pop = 1 << 3,
    Static = 1 << 4,
}

export enum GroupMap {
    String,
    Number,
    Group,
    Exec,
    Pop,
}

export enum StackType {
    Number = 0,
    String = 1,
    Group = 2,
}
