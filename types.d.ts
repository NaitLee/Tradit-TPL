/**
 * Serialized macros.
 * Items are all string;
 * but a number, bigger than 0, indicates how many items to pop & execute;
 * and 0 means concatenate next stack item, to a single item
 */
type MacroSegment = string | number | MacroSegment[];

type SerializedTemplate = { [section: string]: Section; };

/**
 * Assemblized macros.
 * Only array of numbers: count of items to pop, or indexes of other arrays;
 * Items, including plain strings, plain numbers, commands, other `MacroSegmentSerialized`,
 * are stored in dedicated arrays.
 */
type MacroSegmentAssemblized = number[];

type Section = {
    alias: string | null;
    params: string[];
    segments: MacroSegment[] | null;
};

type AssemblizedTemplate = {
    template: number[];
    sections: { [name: string]: number };
    params: {
        public?: boolean;
        no_log?: boolean;
        no_list?: boolean;
        cache?: boolean;
    }[];
    strings: string[];
    groups: MacroSegmentAssemblized[];
    group_maps: ItemRole[][];
}

/**
 * HFS internal things
 */
interface HFS<TypeofFS> {
    file_list<T extends FileEntryGenerator | FileEntryList>(
        args: {
            path: string;
            omit: 'c';
            sse: boolean;
        },
        ctx: KoaContext
    ): Promise<T | APIError>;
    fs: TypeofFS;
}

// Types from HFS, **incomplete subset**

interface HFSPlugin {
    description: string;
    version: number;
    apiRequired: number;
    init?(api: HFSAPI): Partial<HFSPlugin>;
    middleware?(ctx: KoaContext): Promise<void | true | Function>;
    unload?(): void;
    config?: { [key: string]: FieldDescriptor };
    configDialog?: any;
}

type FieldDescriptor = {
    type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect' | 'real_path';
    label?: string;
    defaultValue?: any;
    helperText?: string;
    multiline?: boolean;
    min?: number;
    max?: number;
    options?: { [label: string]: any };
    multiselect?: boolean;
};

interface HFSAPI {
    require: typeof require;
    getConfig(key: string): any;
    log(...args: string[]): void;
    const: { [key: string]: any };
    getConnections(): any[];
    events: any;
    srcDir: string;
}

interface KoaContext {
    path: string;
    url: string;
    query: {
        [key: string]: string;
    };
    method: 'GET' | 'POST' | 'HEAD';
    header: { [key: string]: string };
    body: any;
    status: number;
    set(header: string, value: string): void;
    type: string;
    aborted: boolean;
}

interface FileListEntry {
    n: string;
    m: Date;
    s: number | undefined;
}

type FileEntryGenerator = AsyncGenerator<{ entry: FileListEntry }>;
type FileEntryList = { list: { entry: FileListEntry[] } };

interface APIError extends Error {
    status: number;
    message: string;
}
