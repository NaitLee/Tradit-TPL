"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Macro = exports.Symbols = exports.Macros = exports.MacroSig = void 0;
const tradit_constants_1 = require("./tradit-constants");
var MacroSig;
(function (MacroSig) {
    /** Does nothing, count as static `''`, `0` or nothing, according to context */
    MacroSig[MacroSig["Noop"] = 1] = "Noop";
})(MacroSig = exports.MacroSig || (exports.MacroSig = {}));
exports.Macros = {};
exports.Symbols = {};
/**
 * Some ugly though.
 * Say where should a `new`ed macro be.
 * 0 for nowhere, 1 for `Macros`, 2 for `Symbols`
 */
var putMacroTo = 0;
class Macro {
    constructor(name, process, primaryType = S, argtypes = [], signature = 0b0) {
        this.name = name;
        this.process = process;
        this.primaryType = primaryType;
        this.argtypes = argtypes;
        this.signature = signature;
        if (putMacroTo === 1)
            exports.Macros[name] = this;
        else if (putMacroTo === 2)
            exports.Symbols[name] = this;
    }
}
exports.Macro = Macro;
const N = tradit_constants_1.StackType.Number;
const S = tradit_constants_1.StackType.String;
const TRUE_S = '1';
const FALSE_S = '';
const TRUE_N = 1;
const FALSE_N = 0;
function isStringTrue(s) {
    s = s.trim();
    return !(s === '' || s === '0' || s === tradit_constants_1.NULL_STRING);
}
function fallbackString(...strings) {
    for (let s of strings)
        if (isStringTrue(s))
            return s;
    return tradit_constants_1.NULL_STRING;
}
// Declare macros below
// Arguments: c - process-context, d - routine-context
// Naming: s_foo - variable of static state
putMacroTo = 1;
new Macro('__echo', c => {
    const s_result = c.p.nextString();
    const pass = c.r;
    return async (d) => {
        pass ? await d.p.put(s_result) : d.s.pushString(s_result);
        // await d.p.put(s_result);
    };
});
const Echo = (function () {
    var echo = exports.Macros['__echo'];
    return function (c, string) {
        c.p.pushString(string);
        echo.process(c);
    };
});
const EchoPass = (string) => async (d) => await d.p.put(string);
new Macro('add', c => {
    let s_result = 0;
    let s_pop_count = 0;
    const pass = c.r;
    let value;
    while (c.p.isNotEmpty()) {
        value = c.p.nextNumber();
        if (value === tradit_constants_1.NULL_NUMBER)
            s_pop_count++;
        else
            s_result += value;
    }
    if (s_pop_count === 0) {
        if (pass)
            return EchoPass(s_result.toString());
        c.q.pushNumber(s_result);
        return null;
    }
    return async (d) => {
        let result = s_result;
        for (let i = 0; i < s_pop_count; i++)
            result += d.s.nextNumber();
        pass ? await d.p.put(result.toString()) : d.s.pushNumber(result);
    };
}, N);
new Macro('replace', c => {
    let s_result = c.p.nextString(true);
    let args = [];
    const pass = c.r;
    let value1, value2;
    while (c.p.isNotEmpty()) {
        value1 = c.p.nextString(), value2 = c.p.nextString();
        if (s_result !== tradit_constants_1.NULL_STRING && value1 !== tradit_constants_1.NULL_STRING && value2 !== tradit_constants_1.NULL_STRING) {
            s_result = s_result.replace(value1, value2);
        }
        else {
            args.push(value1, value2);
        }
    }
    if (s_result !== tradit_constants_1.NULL_STRING && args.length === 0) {
        if (pass)
            return EchoPass(s_result);
        c.q.pushString(s_result);
        return null;
    }
    return async (d) => {
        let result = s_result === tradit_constants_1.NULL_STRING ? d.s.nextString(true) : s_result;
        for (let i = 0; i < args.length; i += 2) {
            result = result.replace(args[i] === tradit_constants_1.NULL_STRING ? d.s.nextString() : args[i], args[i + 1] === tradit_constants_1.NULL_STRING ? d.s.nextString() : args[i + 1]);
        }
        pass ? await d.p.put(result) : d.s.pushString(result);
    };
});
new Macro('breadcrumbs', c => {
    const s_template = c.p.nextString();
    const pass = c.r;
    return async (d) => {
        let template = s_template ?? d.s.nextString();
        let parts = decodeURI(d.c.path).split('/');
        if (parts.at(-1) === '')
            parts.pop();
        let bread, result = '';
        for (let i = 0; i < parts.length; i++) {
            bread = template
                .replace('%bread-url%', parts.slice(0, i + 1).join('/') + '/')
                .replace('%bread-name%', parts[i] || '');
            pass ? await d.p.put(bread) : result += bread;
        }
        if (!pass)
            d.s.pushString(result);
    };
});
new Macro('if', c => {
    const { numbers, strings, groups, map, order } = c.p.matrix();
    const s_choice = map[0] & tradit_constants_1.ItemRole.Plain ? (isStringTrue(strings[0]) ? 0 : 1) : tradit_constants_1.NULL_INT;
    const pass = c.r;
    if (s_choice !== tradit_constants_1.NULL_INT && !pass)
        if (map[s_choice + 1] & tradit_constants_1.ItemRole.Plain) {
            c.q.pushString(strings[s_choice + 1]);
            return null;
        }
    return async (d) => {
        let choice = s_choice === tradit_constants_1.NULL_INT ? (isStringTrue(d.s.nextString()) ? 0 : 1) : s_choice;
        let index = choice + 1;
        let result = '';
        let group;
        if (map[index] & tradit_constants_1.ItemRole.Plain) {
            result = strings[index];
        }
        else if (map[index] & tradit_constants_1.ItemRole.Pop) {
            result = d.s.nextString();
        }
        else if (map[index] & tradit_constants_1.ItemRole.Group) {
            group = groups[index];
            await d.i.getGroup(group, d);
            while (!d.s.isEmpty())
                pass ? await d.p.put(d.s.nextString()) : result += d.s.nextString();
        }
        pass ? await d.p.put(result) : d.s.pushString(result);
    };
});
new Macro('urlvar', c => {
    const s_key = c.p.nextString();
    const pass = c.r;
    return async (d) => {
        let key = s_key ?? d.s.nextString();
        let value = d.c.query[key];
        value = value ?? '';
        pass ? await d.p.put(value) : d.s.pushString(value);
    };
});
new Macro('__cat', c => {
    const { s_numbers, s_strings, s_groups, s_map, s_order } = c.p.drain();
    const pass = c.r;
    if (s_map.every(x => x & tradit_constants_1.ItemRole.Plain) && !pass) {
        c.q.pushString(s_strings.join(''));
        return null;
    }
    return async (d) => {
        let value, result = '';
        let count_string = 0, count_group = 0;
        let group;
        for (let type of s_map) {
            if (type & tradit_constants_1.ItemRole.Group) {
                group = s_groups[count_group++];
                await d.i.getGroup(group, d);
                value = d.s.nextString();
                pass ? d.p.put(value) : result += value;
            }
            else {
                value = s_strings[count_string++];
                pass ? d.p.put(value) : result += value;
            }
        }
        if (!pass)
            d.s.pushString(result);
    };
});
new Macro('__sym', c => {
    const s_name = c.p.nextString();
    const pass = c.r;
    if (exports.Symbols[s_name] !== undefined)
        return exports.Symbols[s_name].process(c);
    else {
        c.q.pushString(tradit_constants_1.MacroMarker.Sym + s_name + tradit_constants_1.MacroMarker.Sym);
        return null;
    }
});
new Macro('__dyn', c => {
    // note: No macros except `__dyn` should use `c` in returned function (like below)
    let routine = undefined;
    return async (d) => {
        let name = d.s.nextString();
        if (exports.Macros[name] !== undefined && routine === undefined)
            routine = exports.Macros[name].process(c);
        if (routine !== null && routine !== undefined)
            await routine(d);
    };
});
new Macro('__sec', c => {
    const s_name = c.p.nextString();
    // const pass = c.r;
    return async (d) => {
        let name = s_name === tradit_constants_1.NULL_STRING ? d.s.nextString() : s_name;
        await d.i.getSection(name, d.p, d.l, true);
    };
});
// Declare symbols below
putMacroTo = 2;
new Macro('url', c => {
    const pass = c.r;
    return async (d) => {
        pass ? await d.p.put(d.c.url) : d.s.pushString(d.c.url);
    };
});
function smartSize(size) {
    const precision = 10;
    const units = ['', 'K', 'M', 'G', 'T'];
    let index = 0;
    while (size > 1024) {
        size /= 1024;
        index++;
    }
    let result = (Math.floor(size * precision) / precision).toString();
    if (index !== 0)
        result += ' ' + (units[index] ?? ('e' + index.toString()));
    return result;
}
new Macro('list', c => {
    const pass = true; // c.r;
    if (!pass)
        console.warn('warning: file listing in non-passthrough context');
    return async (d) => {
        if (d.l === null)
            return;
        let t_file = null;
        let t_folder = null;
        let t_link = null;
        t_file = await d.i.getSectionAsText('file', d, true);
        t_folder = await d.i.getSectionAsText('folder', d, true);
        t_link = await d.i.getSectionAsText('link', d, true);
        let value, result = '';
        for await (let { add } of d.l) {
            if (d.c.aborted)
                break;
            if (add === undefined)
                continue;
            value = (add.s === undefined ? t_folder : t_file)
                .replace('%item-url%', d.c.path + add.n)
                .replace('%item-name%', add.n)
                .replace('%item-modified%', add.m?.toLocaleString() ?? '')
                .replace('%item-size%', smartSize(add.s ?? 0));
            pass ? await d.p.put(value) : result += value;
        }
        if (!pass)
            d.s.pushString(result);
    };
});
putMacroTo = 0;
// End
//# sourceMappingURL=tradit-macros.js.map