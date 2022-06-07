
export const PATH_DELIM = process.platform === 'win32' ? '\\' : '/';
export const PLUGIN_PATH = ['.', 'plugins', 'Tradit-TPL', ''].join(PATH_DELIM);
export const CFG_KEY_PATH = 'path';
export const CFG_KEY_DEBUG = 'CFG_KEY_DEBUG';
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
    Verbose = 0b1,
    DumpTpl = 0b10
}

export enum ItemRole {
    Plain = 0b1,
    Group = 0b10,
    PopCount = 0b100,
    Pop = 0b1000,
    Static = 0b10000
}

export enum StackType {
    Number = 0,
    String = 1,
    Group = 2
}
