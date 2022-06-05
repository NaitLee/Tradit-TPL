
import { Macro, Macros } from "./tradit-macros";
import { ItemRole as ItemRole, NULL_INT, NULL_NUMBER, NULL_STRING, StackType } from "./tradit-constants";
import { ReadableForMacros } from "./tradit-handler";
import { groupToString } from "./tradit-misc";
// import { Worker, isMainThread, parentPort, workerData } from "worker_threads";

type Variables = {
    n: {
        [key: string]: number;
    };
    s: {
        [key: string]: string;
    };
};

export interface MacroProcess {
    (c: MacroProcessContext): MacroRoutine | null;
}

export interface MacroRoutine {
    (c: MacroRoutineContext): Promise<void>;
}

export interface MacroProcessContext {
    /** parameters */
    p: MacroParameters;
    /** static parameters */
    q: MacroParameters;
    /** pass-through? */
    r: boolean;
    /** variables of type number */
    vn: {
        [key: string]: number;
    };
    /** variables of type string */
    vs: {
        [key: string]: string;
    };
    /** interpreter instance */
    i: Interpreter;
    /** AssemblizedTemplate */
    t: AssemblizedTemplate;
}

export interface MacroRoutineContext {
    /** stack */
    s: MacroStack;
    /** variables of type number */
    vn: {
        [key: string]: number;
    };
    /** variables of type string */
    vs: {
        [key: string]: string;
    };
    /** break? */
    b: boolean;
    /** disconnect? */
    d: boolean;
    /** interpreter instance */
    i: Interpreter;
    /** file entry generator, if available */
    l: FileEntryGenerator | null;
    /** koa context */
    c: KoaContext;
    /** pass-through readable body */
    p: ReadableForMacros;
}

export class MacroParameters {
    numbers!: number[];
    strings!: string[];
    groups!: number[];
    map!: ItemRole[];
    order!: StackType[];
    constructor(public interpreter: Interpreter) {
        this.numbers = [NULL_NUMBER];
        this.strings = [NULL_STRING];
        this.groups = [NULL_INT];
        this.map = [ItemRole.Plain];
        this.order = [StackType.Number];
        this.drain();
    }
    pushNumber(number: number, role?: ItemRole) {
        if (number !== NULL_NUMBER) this.numbers.push(number);
        role = role || (number === NULL_NUMBER ? ItemRole.Pop : ItemRole.Plain);
        this.map.push(role);
        this.order.push(StackType.Number);
    }
    pushString(string: string, role?: ItemRole) {
        if (string !== NULL_STRING) this.strings.push(string);
        role = role || (string === NULL_STRING ? ItemRole.Pop : ItemRole.Plain);
        this.map.push(role);
        this.order.push(StackType.String);
    }
    pushGroup(group: number, role?: ItemRole) {
        if (group !== NULL_INT) this.groups.push(group);
        role = role || (group === NULL_INT ? ItemRole.Pop : ItemRole.Group);
        this.map.push(role);
        this.order.push(StackType.Group);
    }
    nextNumber(): number {
        let role = this.map.shift();
        let type = this.order.shift();
        if (role === undefined || type === undefined) {
            return NULL_NUMBER;
        }
        let value: number = NULL_NUMBER;
        if (role & ItemRole.Plain) {
            value = type === StackType.Number
                ? (this.numbers.shift() as number)
                : parseFloat(this.strings.shift() as string);
            if (isNaN(value)) {
                console.warn(`warning: encountered NaN in nextNumber`);
                value = 0;
            }
        }
        return value;
    }
    nextString(): string {
        let role = this.map.shift();
        let type = this.order.shift();
        if (role === undefined || type === undefined) {
            return NULL_STRING;
        }
        let value: string = NULL_STRING;
        if (role & ItemRole.Group) {
            value = groupToString(this.groups.shift() as number, this.interpreter.template);
        } else if (role & ItemRole.Plain) {
            value = type === StackType.String
                ? (this.strings.shift() as string)
                : (this.numbers.shift() as number).toString();
        }
        return value;
    }
    nextGroup(): number {
        let role = this.map.shift();
        let type = this.order.shift();
        if (role === undefined || type === undefined) {
            return NULL_INT;
        }
        let value: number = NULL_INT;
        if (role & ItemRole.Group) {
            value = this.groups.shift() as number;
        }
        return value;
    }
    isNextGroup() {
        return !!(this.map[0] ?? (this.map[0] & ItemRole.Group));
    }
    isNextString() {
        return !!(this.order[0] ?? (this.order[0] === StackType.String));
    }
    isNextNumber() {
        return !!(this.order[0] ?? (this.order[0] === StackType.Number));
    }
    expose() {
        return {
            numbers: this.numbers,
            strings: this.strings,
            groups: this.groups,
            map: this.map,
            order: this.order
        };
    }
    matrix() {
        let result = {
            numbers: [] as number[],
            strings: [] as string[],
            groups: [] as number[],
            map: this.map.splice(0),
            order: this.order.splice(0)
        };
        for (let i = 0; i < result.order.length; i++) {
            result.numbers[i] =
                result.order[i] === StackType.Number
                    ? result.map[i] & ItemRole.Plain
                        ? (this.numbers.shift() as number)
                        : NULL_NUMBER
                    : NULL_NUMBER;
            result.strings[i] =
                result.order[i] === StackType.String
                    ? result.map[i] & ItemRole.Plain
                        ? (this.strings.shift() as string)
                        : NULL_STRING
                    : NULL_STRING;
            result.groups[i] =
                result.order[i] === StackType.Group
                    ? (this.groups.shift() as number)
                    : NULL_INT;
        }
        return result;
    }
    drain() {
        return {
            s_numbers: this.numbers.splice(0),
            s_strings: this.strings.splice(0),
            s_groups: this.groups.splice(0),
            s_map: this.map.splice(0),
            s_order: this.order.splice(0)
        };
    }
    isEmpty() {
        return this.order.length === 0;
    }
    isNotEmpty() {
        return this.order.length !== 0;
    }
}

export class MacroStack {
    numbers!: number[];
    strings!: string[];
    order!: StackType[];
    constructor() {
        this.numbers = [NULL_NUMBER];
        this.strings = [NULL_STRING];
        this.order = [StackType.Number, StackType.String];
        this.drain();
    }
    pushNumber(number: number) {
        this.numbers.push(number);
        this.order.push(StackType.Number);
    }
    pushString(string: string) {
        this.strings.push(string);
        this.order.push(StackType.String);
    }
    pushNumbers(...numbers: number[]) {
        for (let n of numbers) {
            this.numbers.push(n);
            this.order.push(StackType.Number);
        }
    }
    pushStrings(...strings: string[]) {
        for (let s of strings) {
            this.strings.push(s);
            this.order.push(StackType.String);
        }
    }
    nextNumber() {
        if (this.order.at(-1) !== StackType.Number) {
            return NULL_NUMBER;
        }
        this.order.shift();
        return this.numbers.shift() ?? NULL_NUMBER;
    }
    nextString() {
        if (this.order.at(-1) !== StackType.String) {
            return NULL_STRING;
        }
        this.order.shift();
        return this.strings.shift() ?? NULL_STRING;
    }
    drain() {
        return {
            numbers: this.numbers.splice(0),
            strings: this.strings.splice(0),
            order: this.order.splice(0)
        };
    }
    concat() {
        const { numbers, strings, order } = this.drain();
        let result = '';
        for (let t of order) {
            if (t === StackType.Number) result += numbers.shift()?.toString();
            else result += strings.shift();
        }
        return result;
    }
    isEmpty() {
        return this.order.length === 0;
    }
}

const SectionPassing: { [key: string]: boolean } = {
    '': true,
    'files': true,
    'nofiles': true,
    'list': true,
    'file': false,
    'folder': false,
    'link': false,
};

export class Interpreter {
    globalVariables: { n: { [key: string]: number }, s: { [key: string]: string } };
    routines: MacroRoutine[][];
    anchors: number[][];
    constructor(public template: AssemblizedTemplate, public api: HFSAPI) {
        this.routines = [];
        this.anchors = [];
        this.globalVariables = { n: {}, s: {} };
        // let total_items = template.groups.map(group => group.length).reduce((a, b) => a + b);
        // let handled_items = 0;
        let time_start = new Date().getTime();
        const prepare_index = (group_index: number, allow_root = false) => {
            let group = template.groups[group_index].concat();
            let group_map = template.group_maps[group_index].concat();
            // two things, containing final "runtime" routine data
            let routine_list: MacroRoutine[],
                anchors: number[];
            // variables for holding temporary values
            let command: string, concat = 0, dynamic = false,
                chunk: number[], chunk_map: ItemRole[], role: ItemRole,
                group_id: number, item_s: string,
                macro: Macro, procedure: MacroRoutine | null;
            // some counters
            let index = 0, command_at = 0, anchor = 0, count = 0;
            // emulate process to see which are "root" macros, give them pass-through option later
            while ((index = group_map.indexOf(ItemRole.PopCount, command_at + 1)) !== -1) {
                count = group[index] || 1;
                command_at = index - count;
                chunk = group.splice(command_at, count + 1, anchor++);
                chunk_map = group_map.splice(command_at, count + 1, ItemRole.Pop);
            }
            // reset counters
            index = 0, command_at = 0, anchor = 0, count = 0;
            // new things
            let next_root_anchor_at = 0;
            // (re-)init
            routine_list = [], anchors = group;
            group = template.groups[group_index].concat();
            group_map = template.group_maps[group_index].concat();
            let ctx = this.newPreparationContext();
            while ((index = group_map.indexOf(ItemRole.PopCount, command_at + 1)) !== -1) {
                count = group[index];
                command_at = index - count;
                if (count === 0) {
                    concat++;
                    count = 1;
                    command_at -= count;
                } else concat = 0;
                if (anchor === anchors[next_root_anchor_at]) {
                    // this will be a routine on root layer
                    ctx.r = allow_root;
                    next_root_anchor_at++;
                }
                chunk = group.splice(command_at, count + 1, anchor++);
                // api.log(JSON.stringify(chunk.map(n => template.strings[n])));
                chunk.pop();
                chunk_map = group_map.splice(command_at, count + 1, ItemRole.Pop);
                // api.log(JSON.stringify(chunk_map));
                chunk_map.pop();
                // api.log('');
                if (chunk_map[0] & ItemRole.Pop) {
                    command = '__dyn';
                    macro = Macros[command];
                    dynamic = true;
                    api.log(`warning: dynamic macro in use, this may cause performance issues`);
                } else {
                    command = concat ? (ctx.r ? '__echo' : '__cat') : template.strings[chunk[0]];
                    if (!concat) {
                        // exclude command
                        chunk.shift();
                        chunk_map.shift();
                    }
                    if (!(macro = Macros[command])) {
                        api.log(`warning: command '${command}' is not implemented`);
                        continue;
                    }
                }
                for (let i = 0; i < chunk.length; i++) {
                    role = chunk_map[i];
                    switch (macro.argtypes[i] || macro.primaryType) {
                        case StackType.Number:
                            if (role & ItemRole.Static) ctx.p.pushNumber(ctx.q.nextNumber(), role);
                            else ctx.p.pushNumber(role & ItemRole.Plain ? parseFloat(template.strings[chunk[i]]) : NULL_NUMBER, role);
                            break;
                        default:
                            group_id = role & ItemRole.Group ? chunk[i] : NULL_INT;
                            if (group_id !== NULL_INT) {
                                prepare_index(group_id, false);
                                ctx.p.pushGroup(group_id, role);
                            } else {
                                ctx.p.pushString(role & ItemRole.Plain ? (
                                    role & ItemRole.Static ? ctx.q.nextString() : template.strings[chunk[i]]
                                ) : NULL_STRING, role);
                            }
                            break;
                    }
                }
                procedure = macro.process(ctx);
                if (procedure) {
                    routine_list.push(procedure);
                } else {
                    group_map[command_at] = ItemRole.Static | ItemRole.Plain;
                }
                if (ctx.r) {
                    // remove final items that won't change anymore, improve array performance
                    group.shift(), group_map.shift();
                    index -= 1, command_at -= 1;
                    ctx.r = false;
                }
                // if (dynamic) ctx = this.newPreparationContext();
                if (!ctx.p.isEmpty()) {
                    api.log(`warning: leftovers of parameters after ${command} #${anchor}`);
                    ctx.p.drain();
                }
                // handled_items += count;
            }
            // reset counters
            index = 0, command_at = 0, anchor = 0, count = 0;
            while ((index = group_map.indexOf(ItemRole.Plain, command_at)) !== -1) {
                item_s = template.strings[group[index]] as string;
                ctx.p.pushString(item_s, ItemRole.Plain);
                ctx.r = allow_root;
                procedure = Macros['__echo'].process(ctx);
                if (procedure) routine_list.push(procedure);
                command_at = index + 1;
            }
            this.routines[group_index] = routine_list;
            this.anchors[group_index] = anchors;
        }
        for (let name in template.sections) {
            let i = template.template[template.sections[name]];
            prepare_index(i, SectionPassing[name] ?? true);
        }
        let time_elapsed = new Date().getTime() - time_start;
        if (time_elapsed >= 1000) api.log(`[interpreter] initialized in ${Math.floor(time_elapsed / 100) / 10} seconds`);
    }
    newPreparationContext() {
        return {
            p: new MacroParameters(this), q: new MacroParameters(this),
            vn: Object.setPrototypeOf({}, this.globalVariables.n),
            vs: Object.setPrototypeOf({}, this.globalVariables.s),
            r: false, t: this.template, i: this
        };
    }
    newRoutineContext(readable: ReadableForMacros, entry_generator: FileEntryGenerator | null): MacroRoutineContext {
        return {
            s: new MacroStack(), l: entry_generator,
            vn: Object.setPrototypeOf({}, this.globalVariables.n),
            vs: Object.setPrototypeOf({}, this.globalVariables.s),
            b: false, d: false,
            i: this, c: readable.ctx, p: readable
        };
    }
    async *getGroupGenerator(id: number, context: MacroRoutineContext) {
        let macro_context = context;
        let list = this.routines[id];
        let size = list.length;
        for (let i = 0; i < size; i++) {
            await list[i](macro_context);
            if (macro_context.b || macro_context.d)
                break;
            yield true;
        }
        macro_context.s.drain();
        yield false;
        return null;
    }
    async getGroup(id: number, context: MacroRoutineContext) {
        let macro_context = context;
        let list = this.routines[id];
        let size = list.length;
        for (let i = 0; i < size; i++) {
            await list[i](macro_context);
            if (macro_context.b || macro_context.d)
                break;
        }
        // macro_context.s.drain();
        return null;
    }
    getSectionIndex(name: string, allow_private = false) {
        let id = this.template.sections[name];
        let index = this.template.template[id];
        return (this.routines[id] && (this.template.params[id].public || allow_private)) ? index : -1;
    }
    hasSection(name: string, allow_private = false) {
        return this.getSectionIndex(name, allow_private) !== -1;
    }
    async getSectionAsText(name: string, ctx: MacroRoutineContext, allow_private = true) {
        let index = this.getSectionIndex(name, allow_private);
        if (index === -1) return NULL_STRING;
        let old_stack = ctx.s;
        let new_stack = ctx.s = new MacroStack();
        await this.getGroup(index, ctx);
        let result = new_stack.concat();
        ctx.s = old_stack;
        return result;
    }
    getSectionGenerator(name: string, readable: ReadableForMacros, entry_generator: FileEntryGenerator | null, allow_private = false) {
        let index = this.getSectionIndex(name, allow_private);
        if (index === -1) return null;
        let ctx = this.newRoutineContext(readable, entry_generator);
        return this.getGroupGenerator(index, ctx);
    }
    getSection(name: string, readable: ReadableForMacros, entry_generator: FileEntryGenerator | null, allow_private = false) {
        let index = this.getSectionIndex(name, allow_private);
        if (index === -1) return null;
        let ctx = this.newRoutineContext(readable, entry_generator);
        return this.getGroup(index, ctx);
    }
}
