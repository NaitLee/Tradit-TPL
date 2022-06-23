
import { GroupMap } from "./tradit-constants";

enum MacroFlags {
    /** Is a symbol */
    Symbol = 1 << 0,
    /** Is No-op, e.g. {.comment.} */
    Noop = 1 << 1,
    /** Should jump out & execute JS */
    NonWasm = 1 << 2,
}

export const Macros: {
    [key: string]: MacroInfo
} = {};

export class MacroInfo {
    /**
     *
     * @param name macro name
     * @param argtype a function that returns parameter type at position `i`
     * @param returntype
     * @param flags
     */
    constructor(
        public name: string,
        public argtype: (i: number) => GroupMap = () => GroupMap.String,
        public returntype: GroupMap = GroupMap.String,
        public flags: MacroFlags = 0
    ) {
        Macros[name] = this;
    }
}

new MacroInfo('add', () => GroupMap.Number, GroupMap.Number);
