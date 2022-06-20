"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.instantiate = void 0;
async function instantiate(module, imports = {}) {
    const adaptedImports = {
        env: Object.assign(Object.create(globalThis), imports.env || {}, {
            abort(message, fileName, lineNumber, columnNumber) {
                // ~lib/builtins/abort(~lib/string/String | null?, ~lib/string/String | null?, u32?, u32?) => void
                message = __liftString(message >>> 0);
                fileName = __liftString(fileName >>> 0);
                lineNumber = lineNumber >>> 0;
                columnNumber = columnNumber >>> 0;
                (() => {
                    // @external.js
                    throw Error(`${message} in ${fileName}:${lineNumber}:${columnNumber}`);
                })();
            },
        }),
    };
    const { exports } = await WebAssembly.instantiate(module, adaptedImports);
    const memory = exports.memory || imports.env.memory;
    const adaptedExports = Object.setPrototypeOf({
        helloWorld() {
            // asm/index/helloWorld() => ~lib/string/String
            return __liftString(exports.helloWorld() >>> 0);
        },
        testArray(array) {
            // asm/index/testArray(~lib/array/Array<i32>) => i32
            array = __lowerArray((pointer, value) => { new Int32Array(memory.buffer)[pointer >>> 2] = value; }, 5, 2, array) || __notnull();
            return exports.testArray(array);
        },
        tryMacro(name) {
            // asm/index/tryMacro(~lib/string/String) => bool
            name = __lowerString(name) || __notnull();
            return exports.tryMacro(name) != 0;
        },
    }, exports);
    function __liftString(pointer) {
        if (!pointer)
            return null;
        const end = pointer + new Uint32Array(memory.buffer)[pointer - 4 >>> 2] >>> 1, memoryU16 = new Uint16Array(memory.buffer);
        let start = pointer >>> 1, string = "";
        while (end - start > 1024)
            string += String.fromCharCode(...memoryU16.subarray(start, start += 1024));
        return string + String.fromCharCode(...memoryU16.subarray(start, end));
    }
    function __lowerString(value) {
        if (value == null)
            return 0;
        const length = value.length, pointer = exports.__new(length << 1, 1) >>> 0, memoryU16 = new Uint16Array(memory.buffer);
        for (let i = 0; i < length; ++i)
            memoryU16[(pointer >>> 1) + i] = value.charCodeAt(i);
        return pointer;
    }
    function __lowerArray(lowerElement, id, align, values) {
        if (values == null)
            return 0;
        const length = values.length, buffer = exports.__pin(exports.__new(length << align, 0)) >>> 0, header = exports.__pin(exports.__new(16, id)) >>> 0, memoryU32 = new Uint32Array(memory.buffer);
        memoryU32[header + 0 >>> 2] = buffer;
        memoryU32[header + 4 >>> 2] = buffer;
        memoryU32[header + 8 >>> 2] = length << align;
        memoryU32[header + 12 >>> 2] = length;
        for (let i = 0; i < length; ++i)
            lowerElement(buffer + (i << align >>> 0), values[i]);
        exports.__unpin(buffer);
        exports.__unpin(header);
        return header;
    }
    function __notnull() {
        throw TypeError("value must not be null");
    }
    return adaptedExports;
}
exports.instantiate = instantiate;
//# sourceMappingURL=tradit-wasm.js.map