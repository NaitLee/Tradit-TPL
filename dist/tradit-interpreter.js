"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Interpreter = exports.MacroStack = exports.MacroParameters = void 0;
const tradit_macros_1 = require("./tradit-macros");
const tradit_constants_1 = require("./tradit-constants");
const tradit_misc_1 = require("./tradit-misc");
class MacroParameters {
    constructor(interpreter) {
        this.interpreter = interpreter;
        this.numbers = [tradit_constants_1.NULL_NUMBER];
        this.strings = [tradit_constants_1.NULL_STRING];
        this.groups = [tradit_constants_1.NULL_INT];
        this.map = [tradit_constants_1.ItemRole.Plain];
        this.order = [tradit_constants_1.StackType.Number];
        this.drain();
    }
    pushNumber(number, role) {
        if (number !== tradit_constants_1.NULL_NUMBER)
            this.numbers.push(number);
        role = role || (number === tradit_constants_1.NULL_NUMBER ? tradit_constants_1.ItemRole.Pop : tradit_constants_1.ItemRole.Plain);
        this.map.push(role);
        this.order.push(tradit_constants_1.StackType.Number);
    }
    pushString(string, role) {
        if (string !== tradit_constants_1.NULL_STRING)
            this.strings.push(string);
        role = role || (string === tradit_constants_1.NULL_STRING ? tradit_constants_1.ItemRole.Pop : tradit_constants_1.ItemRole.Plain);
        this.map.push(role);
        this.order.push(tradit_constants_1.StackType.String);
    }
    pushGroup(group, role) {
        if (group !== tradit_constants_1.NULL_INT)
            this.groups.push(group);
        role = role || (group === tradit_constants_1.NULL_INT ? tradit_constants_1.ItemRole.Pop : tradit_constants_1.ItemRole.Group);
        this.map.push(role);
        this.order.push(tradit_constants_1.StackType.Group);
    }
    nextNumber() {
        let role = this.map.shift();
        let type = this.order.shift();
        if (role === undefined || type === undefined) {
            return tradit_constants_1.NULL_NUMBER;
        }
        let value = tradit_constants_1.NULL_NUMBER;
        if (role & tradit_constants_1.ItemRole.Plain) {
            value = type === tradit_constants_1.StackType.Number
                ? this.numbers.shift()
                : parseFloat(this.strings.shift());
            if (isNaN(value)) {
                console.warn(`warning: encountered NaN in nextNumber`);
                value = 0;
            }
        }
        return value;
    }
    nextString() {
        let role = this.map.shift();
        let type = this.order.shift();
        if (role === undefined || type === undefined) {
            return tradit_constants_1.NULL_STRING;
        }
        let value = tradit_constants_1.NULL_STRING;
        if (role & tradit_constants_1.ItemRole.Group) {
            value = (0, tradit_misc_1.groupToString)(this.groups.shift(), this.interpreter.template);
        }
        else if (role & tradit_constants_1.ItemRole.Plain) {
            value = type === tradit_constants_1.StackType.String
                ? this.strings.shift()
                : this.numbers.shift().toString();
        }
        return value;
    }
    nextGroup() {
        let role = this.map.shift();
        let type = this.order.shift();
        if (role === undefined || type === undefined) {
            return tradit_constants_1.NULL_INT;
        }
        let value = tradit_constants_1.NULL_INT;
        if (role & tradit_constants_1.ItemRole.Group) {
            value = this.groups.shift();
        }
        return value;
    }
    isNextGroup() {
        return !!(this.map[0] ?? (this.map[0] & tradit_constants_1.ItemRole.Group));
    }
    isNextString() {
        return !!(this.order[0] ?? (this.order[0] === tradit_constants_1.StackType.String));
    }
    isNextNumber() {
        return !!(this.order[0] ?? (this.order[0] === tradit_constants_1.StackType.Number));
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
            numbers: [],
            strings: [],
            groups: [],
            map: this.map.splice(0),
            order: this.order.splice(0)
        };
        for (let i = 0; i < result.order.length; i++) {
            result.numbers[i] =
                result.order[i] === tradit_constants_1.StackType.Number
                    ? result.map[i] & tradit_constants_1.ItemRole.Plain
                        ? this.numbers.shift()
                        : tradit_constants_1.NULL_NUMBER
                    : tradit_constants_1.NULL_NUMBER;
            result.strings[i] =
                result.order[i] === tradit_constants_1.StackType.String
                    ? result.map[i] & tradit_constants_1.ItemRole.Plain
                        ? this.strings.shift()
                        : tradit_constants_1.NULL_STRING
                    : tradit_constants_1.NULL_STRING;
            result.groups[i] =
                result.order[i] === tradit_constants_1.StackType.Group
                    ? this.groups.shift()
                    : tradit_constants_1.NULL_INT;
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
exports.MacroParameters = MacroParameters;
class MacroStack {
    constructor() {
        this.numbers = [tradit_constants_1.NULL_NUMBER];
        this.strings = [tradit_constants_1.NULL_STRING];
        this.order = [tradit_constants_1.StackType.Number, tradit_constants_1.StackType.String];
        this.drain();
    }
    pushNumber(number) {
        this.numbers.push(number);
        this.order.push(tradit_constants_1.StackType.Number);
    }
    pushString(string) {
        this.strings.push(string);
        this.order.push(tradit_constants_1.StackType.String);
    }
    pushNumbers(...numbers) {
        for (let n of numbers) {
            this.numbers.push(n);
            this.order.push(tradit_constants_1.StackType.Number);
        }
    }
    pushStrings(...strings) {
        for (let s of strings) {
            this.strings.push(s);
            this.order.push(tradit_constants_1.StackType.String);
        }
    }
    nextNumber() {
        if (this.order.at(-1) !== tradit_constants_1.StackType.Number) {
            return tradit_constants_1.NULL_NUMBER;
        }
        this.order.shift();
        return this.numbers.shift() ?? tradit_constants_1.NULL_NUMBER;
    }
    nextString() {
        if (this.order.at(-1) !== tradit_constants_1.StackType.String) {
            return tradit_constants_1.NULL_STRING;
        }
        this.order.shift();
        return this.strings.shift() ?? tradit_constants_1.NULL_STRING;
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
            if (t === tradit_constants_1.StackType.Number)
                result += numbers.shift()?.toString();
            else
                result += strings.shift();
        }
        return result;
    }
    isEmpty() {
        return this.order.length === 0;
    }
}
exports.MacroStack = MacroStack;
const SectionPassing = {
    '': true,
    'files': true,
    'nofiles': true,
    'list': true,
    'file': false,
    'folder': false,
    'link': false,
};
class Interpreter {
    constructor(template, api) {
        this.template = template;
        this.api = api;
        this.routines = [];
        this.anchors = [];
        this.globalVariables = { n: {}, s: {} };
        // let total_items = template.groups.map(group => group.length).reduce((a, b) => a + b);
        // let handled_items = 0;
        let time_start = new Date().getTime();
        const prepare_index = (group_index, allow_root = false) => {
            let group = template.groups[group_index].concat();
            let group_map = template.group_maps[group_index].concat();
            // two things, containing final "runtime" routine data
            let routine_list, anchors;
            // variables for holding temporary values
            let command, concat = 0, dynamic = false, chunk, chunk_map, role, group_id, item_s, macro, procedure;
            // some counters
            let index = 0, command_at = 0, anchor = 0, count = 0;
            // emulate process to see which are "root" macros, give them pass-through option later
            while ((index = group_map.indexOf(tradit_constants_1.ItemRole.PopCount, command_at + 1)) !== -1) {
                count = group[index] || 1;
                command_at = index - count;
                chunk = group.splice(command_at, count + 1, anchor++);
                chunk_map = group_map.splice(command_at, count + 1, tradit_constants_1.ItemRole.Pop);
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
            while ((index = group_map.indexOf(tradit_constants_1.ItemRole.PopCount, command_at + 1)) !== -1) {
                count = group[index];
                command_at = index - count;
                if (count === 0) {
                    concat++;
                    count = 1;
                    command_at -= count;
                }
                else
                    concat = 0;
                if (anchor === anchors[next_root_anchor_at]) {
                    // this will be a routine on root layer
                    ctx.r = allow_root;
                    next_root_anchor_at++;
                }
                chunk = group.splice(command_at, count + 1, anchor++);
                // api.log(JSON.stringify(chunk.map(n => template.strings[n])));
                chunk.pop();
                chunk_map = group_map.splice(command_at, count + 1, tradit_constants_1.ItemRole.Pop);
                // api.log(JSON.stringify(chunk_map));
                chunk_map.pop();
                // api.log('');
                if (chunk_map[0] & tradit_constants_1.ItemRole.Pop) {
                    command = '__dyn';
                    macro = tradit_macros_1.Macros[command];
                    dynamic = true;
                    api.log(`warning: dynamic macro in use, this may cause performance issues`);
                }
                else {
                    command = concat ? (ctx.r ? '__echo' : '__cat') : template.strings[chunk[0]];
                    if (!concat) {
                        // exclude command
                        chunk.shift();
                        chunk_map.shift();
                    }
                    if (!(macro = tradit_macros_1.Macros[command])) {
                        api.log(`warning: command '${command}' is not implemented`);
                        continue;
                    }
                }
                for (let i = 0; i < chunk.length; i++) {
                    role = chunk_map[i];
                    switch (macro.argtypes[i] || macro.primaryType) {
                        case tradit_constants_1.StackType.Number:
                            if (role & tradit_constants_1.ItemRole.Static)
                                ctx.p.pushNumber(ctx.q.nextNumber(), role);
                            else
                                ctx.p.pushNumber(role & tradit_constants_1.ItemRole.Plain ? parseFloat(template.strings[chunk[i]]) : tradit_constants_1.NULL_NUMBER, role);
                            break;
                        default:
                            group_id = role & tradit_constants_1.ItemRole.Group ? chunk[i] : tradit_constants_1.NULL_INT;
                            if (group_id !== tradit_constants_1.NULL_INT) {
                                prepare_index(group_id, false);
                                ctx.p.pushGroup(group_id, role);
                            }
                            else {
                                ctx.p.pushString(role & tradit_constants_1.ItemRole.Plain ? (role & tradit_constants_1.ItemRole.Static ? ctx.q.nextString() : template.strings[chunk[i]]) : tradit_constants_1.NULL_STRING, role);
                            }
                            break;
                    }
                }
                procedure = macro.process(ctx);
                if (procedure) {
                    routine_list.push(procedure);
                }
                else {
                    group_map[command_at] = tradit_constants_1.ItemRole.Static | tradit_constants_1.ItemRole.Plain;
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
            while ((index = group_map.indexOf(tradit_constants_1.ItemRole.Plain, command_at)) !== -1) {
                item_s = template.strings[group[index]];
                ctx.p.pushString(item_s, tradit_constants_1.ItemRole.Plain);
                ctx.r = allow_root;
                procedure = tradit_macros_1.Macros['__echo'].process(ctx);
                if (procedure)
                    routine_list.push(procedure);
                command_at = index + 1;
            }
            this.routines[group_index] = routine_list;
            this.anchors[group_index] = anchors;
        };
        for (let name in template.sections) {
            let i = template.template[template.sections[name]];
            prepare_index(i, SectionPassing[name] ?? true);
        }
        let time_elapsed = new Date().getTime() - time_start;
        if (time_elapsed >= 1000)
            api.log(`[interpreter] initialized in ${Math.floor(time_elapsed / 100) / 10} seconds`);
    }
    newPreparationContext() {
        return {
            p: new MacroParameters(this), q: new MacroParameters(this),
            vn: Object.setPrototypeOf({}, this.globalVariables.n),
            vs: Object.setPrototypeOf({}, this.globalVariables.s),
            r: false, t: this.template, i: this
        };
    }
    newRoutineContext(readable, entry_generator) {
        return {
            s: new MacroStack(), l: entry_generator,
            vn: Object.setPrototypeOf({}, this.globalVariables.n),
            vs: Object.setPrototypeOf({}, this.globalVariables.s),
            b: false, d: false,
            i: this, c: readable.ctx, p: readable
        };
    }
    async *getGroupGenerator(id, context) {
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
    async getGroup(id, context) {
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
    getSectionIndex(name, allow_private = false) {
        let id = this.template.sections[name];
        let index = this.template.template[id];
        return (this.routines[id] && (this.template.params[id].public || allow_private)) ? index : -1;
    }
    hasSection(name, allow_private = false) {
        return this.getSectionIndex(name, allow_private) !== -1;
    }
    async getSectionAsText(name, ctx, allow_private = true) {
        let index = this.getSectionIndex(name, allow_private);
        if (index === -1)
            return tradit_constants_1.NULL_STRING;
        let old_stack = ctx.s;
        let new_stack = ctx.s = new MacroStack();
        await this.getGroup(index, ctx);
        let result = new_stack.concat();
        ctx.s = old_stack;
        return result;
    }
    getSectionGenerator(name, readable, entry_generator, allow_private = false) {
        let index = this.getSectionIndex(name, allow_private);
        if (index === -1)
            return null;
        let ctx = this.newRoutineContext(readable, entry_generator);
        return this.getGroupGenerator(index, ctx);
    }
    getSection(name, readable, entry_generator, allow_private = false) {
        let index = this.getSectionIndex(name, allow_private);
        if (index === -1)
            return null;
        let ctx = this.newRoutineContext(readable, entry_generator);
        return this.getGroup(index, ctx);
    }
}
exports.Interpreter = Interpreter;
//# sourceMappingURL=tradit-interpreter.js.map