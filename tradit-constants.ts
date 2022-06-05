
export const PLUGIN_PATH = './plugins/Tradit-TPL/';
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
    Debug = 0b1,
    Verbose = 0b10
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
