
///<reference path="types.d.ts" />

import { DebugFlags, GroupMap, ItemRole, MacroMarker, PLUGIN_PATH } from "./tradit-constants";
import { Debug, HFS } from "./tradit-globals";
import { Symbols } from "./tradit-macros";
import { Wasm } from "./tradit-globals";
import { MacroInfo, Macros } from "./tradit-macros-wasm";

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
    data: { [section: string]: SectionStage1 };
    section!: string;
    segments!: MacroSegmentStage1[];
    groups!: MacroSegmentStage1[][];
    group!: MacroSegmentStage1[];
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
 * Template unifying, stage 1  
 * Historically "serialize"
 */
export function stage1(input: string): TemplateStage1 {
    let sections: string[] = [];
    input = '\n' + input
        // use \n
        .replace(/\r\n/g, '\n')
        // fix order. #FIXME
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

/**
 * Template unifying, stage 2  
 * Historically "assemblize"
 */
export function stage2(serialized: TemplateStage1): TemplateStage2 {
    let sectionId2GroupIndex: number[] = [];
    let sectionName2Id: { [name: string]: number } = {};
    let params: {
        is_public: boolean;
        no_log: boolean;
        no_list: boolean;
        cache: boolean;
    }[] = [];
    let strings: string[] = [];
    let groups: MacroSegmentStage2[] = [];
    let groupMaps: ItemRole[][] = [];
    let string_map: { [key: string]: number } = {};
    let count = [0, 0];
    function process(subgroup: MacroSegmentStage1[]) {
        let layer: MacroSegmentStage2 = [];
        let layer_map: ItemRole[] = [];
        groups.push(layer);
        groupMaps.push(layer_map);
        let layer_id = count[1]++;
        for (let item of subgroup) {
            switch (typeof item) {
                case 'number':
                    layer.push(item);
                    layer_map.push(ItemRole.PopCount);
                    break;
                case 'string':
                    if (!string_map[item]) {
                        string_map[item] = strings.push(item) - 1;
                    }
                    layer.push(string_map[item]);
                    layer_map.push(ItemRole.Plain);
                    break;
                case 'object':
                    layer.push(process(item));
                    layer_map.push(ItemRole.Group);
                    break;
            }
        }
        return layer_id;
    }
    for (let name in serialized) {
        let section = serialized[name];
        if (section.alias !== null && sectionName2Id[section.alias] !== null) {
            sectionName2Id[name] = sectionName2Id[section.alias];
            continue;
        }
        let root_group = section.segments;
        if (!root_group) continue;
        params.push({
            no_log: section.params.includes('no log'),
            no_list: section.params.includes('no list'),
            cache: section.params.includes('cache'),
            is_public: section.params.includes('public') || name === '',
        });
        sectionName2Id[name] = sectionId2GroupIndex.push(process(root_group)) - 1;
    }
    return {
        sectionId2GroupIndex: sectionId2GroupIndex,
        sectionName2Id: sectionName2Id,
        params: params,
        strings: strings,
        groups: groups,
        groupMaps: groupMaps,
    };
}

export function stage3(template: TemplateStage2): TemplateStage2 {
    function process_group(index: number) {
        let group = template.groups[index].concat();
        let map = template.groupMaps[index].concat();
        let chunk: number[],
            chunk_map: ItemRole[];
        let new_group: number[] = [],
            new_map: GroupMap[] = [];
        let i = 0, command_at = 0, anchor = 0, count = 0;
        let is_concat = false;
        let command: string, macro: MacroInfo;
        while ((i = map.indexOf(ItemRole.PopCount, command_at + 1)) !== -1) {
            count = group[i] || (is_concat = true, 1);
            command_at = i - count;
            chunk = group.splice(command_at, count + 1, anchor++);
            chunk_map = map.splice(command_at, count + 1, ItemRole.Pop);
            chunk.pop(); chunk_map.pop();
            if (chunk_map[0] & ItemRole.Pop) {
                // Dynamic
            } else {
                command = is_concat ? '__cat' : template.strings[chunk[0]];
                if (!is_concat) chunk.shift(), chunk_map.shift(); // exclude command
                if (!(macro = Macros[command])) {}
            }
            // new_group.push(..., count);
            // new_map.push(..., GroupMap.Exec);
            is_concat = false;
        }
        Wasm.addGroup({
            order: new_group,
            map: new_map
        });
        for (let i = 0; i < new_map.length; i++) {}
    }
    Wasm.addStrings(template.strings);
    for (let name in template.sectionName2Id) {
        let id = template.sectionName2Id[name];
        let index = template.sectionId2GroupIndex[id];
        Wasm.addSection(name, id, index);
        Wasm.addParams(template.params[id]);
        process_group(index);
    }
    return template;
}

/**
 * 
 * @param template whole template content as string
 */
export function unifyTemplate(template: string): TemplateStage2 {
    let st1 = stage1(template);
    let st2 = stage2(st1);
    let st3 = stage3(st2);
    if (Debug & DebugFlags.DumpTpl) {
        HFS.fs.writeFileSync(PLUGIN_PATH + 'tradit-tpl.1.json', JSON.stringify(st1, void 0, 4), 'utf-8');
        HFS.fs.writeFileSync(PLUGIN_PATH + 'tradit-tpl.2.json', JSON.stringify(st2, void 0, 4), 'utf-8');
    }
    return st3;
}
