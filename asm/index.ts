
import { Macros } from "./macros";

export function helloWorld(): string {
    return 'Hello, world!';
}

export function testArray(array: i32[]): i32 {
    return array.pop();
}

export function tryMacro(name: string): boolean {
    if (!Macros.has(name)) return false;
    Macros.get(name)();
    return true;
}
