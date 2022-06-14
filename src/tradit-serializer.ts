
///<reference path="types.d.ts" />

import { MacroMarker } from "./tradit-constants";
import { Symbols } from "./tradit-macros";

const { Open, Close, Sep, Quote, Dequote, Sym } = MacroMarker;

/**
 * An IO-alike class for obtaining data with ease
 */
class StringIO {
    pointer;
    string;
    constructor(string: string) {
        this.pointer = 0;
        this.string = string;
    }
    read(length?: number) {
        if (length !== undefined)
            return this.string.slice(this.pointer, (this.pointer += length));
        else
            return this.string.slice(
                this.pointer,
                (this.pointer = this.string.length)
            );
    }
    fetch(length?: number) {
        if (length !== undefined)
            return this.string.slice(this.pointer, this.pointer + length);
        else return this.string.slice(this.pointer);
    }
    readline() {
        let start = this.pointer;
        this.pointer = this.string.indexOf('\n', this.pointer) + 1;
        return this.string.slice(start, this.pointer);
    }
    tell() {
        return this.pointer;
    }
}

/**
 * Template/Section/Macro Serializer
 */
class Serializer {
    data: { [section: string]: Section };
    section!: string;
    segments!: MacroSegment[];
    groups!: MacroSegment[][];
    group!: MacroSegment[];
    constructor() {
        this.data = {};
        this.addsection('[]');
    }
    addsection(section: string) {
        this.groups = [];
        let matches = section.match(/^\n*\[([+^]?)([^\|]*?)(\|.+)?\]\n*$/);
        if (!matches) return;
        let names = matches[2].split(/ *= */g).map(s => s.trim());
        let params =
            matches[3]
                ?.slice(1)
                .split(/ *\| */g)
                .map(s => s.trim()) || [];
        this.section = names[0];
        if (matches[1] == '+' && this.data[this.section]) {
            // @ts-ignore
            this.group = this.segments = this.data[this.section].segments;
            return;
        } else if (matches[1] == '^' && this.data[this.section]) {
            // @ts-ignore
            this.segments = this.data[this.section].segments;
            this.segments.unshift('dequote', (this.group = []), 2);
            return;
        }
        for (let name of names) {
            this.data[name] = {
                alias: this.section,
                params: params,
                segments: null,
            };
        }
        this.data[this.section] = {
            alias: null,
            params: params,
            segments: (this.group = []),
        };
    }
    push(...items: string[]) {
        this.group.push(...items);
    }
    exec(count: number) {
        this.group.push(count);
    }
    startgroup() {
        this.groups.push(this.group);
        this.group.push((this.group = []));
    }
    endgroup() {
        let group = this.groups.pop();
        if (group !== undefined) this.group = group;
        return group !== undefined;
    }
    export() {
        return this.data;
    }
}

function escape(s: string): string {
    return s.replace(/([\\\(\)\[\]\{\}\|\.\+\*\?\^])/g, '\\$1');
}

/**
 * Input the whole template, give you the *serialized* result
 */
export function serialize(input: string): SerializedTemplate {
    let sections: string[] = [];
    input = '\n' + input
        // use \n
        .replace(/\r\n/g, '\n')
        // fix order
        .replace(new RegExp(`${escape(Sep)}(\\s+?)${escape(Quote)}`, 'gm'), `${Sep}${Quote}$1`)
        .replace(new RegExp(`${escape(Dequote)}(\\s+?)(${escape(Sep)}|${escape(Close)})`, 'gm'), `$1${Dequote}$2`)
        // hack
        .replace('%files%', '{.$files.}')
        // replace all "known" symbols as macros
        .replace(
            new RegExp(escape(Sym) + '(.+?)' + escape(Sym), 'g'),
            (sub, arg) =>
                Symbols[arg] === undefined
                    ? sub : Open + '__sym' + Sep + arg + Close
        )
        // shortcuts
        .replace(new RegExp(`${escape(Open)}!`, 'g'), Open + '__loc' + Sep)
        .replace(new RegExp(`${escape(Open)}\\$`, 'g'), Open + '__sec' + Sep)
        .replace(new RegExp(`${escape(Open)}\\^`, 'g'), Open + '__var' + Sep)
        .replace(new RegExp(`${escape(Open)}\\s*([^${escape(Sep)}]+?)\\s*` +
                `(=|==|>|<|>=|<=|<>|!=)\\s*([^${escape(Sep)}/]+?)\\s*${escape(Close)}`, 'gm'),
                `${Open}$2${Sep}$1${Sep}$3${Close}`)
        .replace(new RegExp(`${escape(Open)}([0-9+\\-*/\\s]+)${escape(Close)}`, 'gm'),
                `${Open}calc${Sep}$1${Close}`);
    for (
        let i = 0, j = input.indexOf('\n[');
        i !== -1;
        i = j, j = input.indexOf('\n[', j + 2)
    ) {
        sections.push(input.slice(i + 1, j));
    }

    const out = new Serializer();

    let line = 0,
        column = 0;

    function fatal(message: string) {
        throw new Error(message + ` at line ${line}, column ${column}`);
    }

    const longest_marker_length = Math.max(...Object.values(MacroMarker).map(s => s.length));

    for (const raw of sections) {
        const io = new StringIO(raw);
        out.addsection(io.readline());
        line += 2; column = 0;
        let char, combo, pointer, chunk;
        let anchor = io.tell(),
            stack = -1,
            last_split_at = 0;
        let count: number[] = [],
            concat: { [stack: number]: number | undefined } = {};
        while (true) {
            pointer = io.tell();
            combo = io.fetch(longest_marker_length);
            char = io.read(1);
            if (!char) break;
            if (combo.startsWith(Open) || combo.startsWith(Quote)) {
                if (pointer > anchor) {
                    chunk = io.string.slice(anchor, pointer);
                    if (chunk.at(-1) === '=' && stack !== -1) {
                        out.push('__opt', chunk.slice(0, -1));
                        count[stack]--;
                        concat[stack] = 3;
                    } else if (stack !== -1) {
                        if (concat[stack] !== undefined) {
                            out.push(chunk);
                            // @ts-ignore
                            concat[stack] += 2;
                        } else {
                            out.push('__cat', chunk);
                            concat[stack] = 3;
                        }
                    } else {
                        out.push('__echo', chunk);
                        out.exec(2);
                    }
                }
                stack = count.push(0) - 1;
                anchor = pointer + 2;
                if (combo.startsWith(Quote)) out.startgroup();
            } else if (combo.startsWith(Close) || combo.startsWith(Dequote)) {
                if (pointer > anchor || last_split_at == pointer - 1)
                    out.push(io.string.slice(anchor, pointer));
                count[stack]++;
                anchor = pointer + 2;
                if (count.length === 0) fatal(`Unmatched '${combo}'`);
                if (concat[stack] !== undefined) {
                    // @ts-ignore
                    if (concat[stack] > 0) out.exec(concat[stack] + 1);
                    concat[stack] = undefined;
                }
                if (combo.startsWith(Close)) out.exec(count.pop() || 0);
                stack--;
                if (combo.startsWith(Dequote)) {
                    out.endgroup() || fatal(`Unmatched '${combo}'`);
                    count.pop();
                }
            } else if (combo.startsWith(Sep) && stack !== -1) {
                if (concat[stack] !== undefined) {
                    // @ts-ignore
                    if (concat[stack] > 0) out.exec(concat[stack]);
                    concat[stack] = undefined;
                }
                if (pointer > anchor || last_split_at == pointer - 1) {
                    out.push(io.string.slice(anchor, pointer));
                }
                count[stack]++;
                anchor = pointer + 1;
                last_split_at = pointer;
            }
            if (char === '\n') {
                column = 0; line++;
            }
            else column++;
        }
        if (pointer > anchor) {
            out.push('__echo', io.string.slice(anchor, pointer));
            out.exec(2);
        }
        if (stack !== -1)
            fatal(`${stack + 1} levels of macro/quote left unclosed`);
    }
    return out.export();
}
