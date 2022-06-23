export async function instantiate(module, imports = {}) {
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
    addSection(name, id, index) {
      // asm/index/addSection(~lib/string/String, i32, i32) => void
      name = __lowerString(name) || __notnull();
      exports.addSection(name, id, index);
    },
    addParams(parameters) {
      // asm/index/addParams(asm/index/SectionParams) => void
      parameters = __lowerRecord5(parameters) || __notnull();
      exports.addParams(parameters);
    },
    addStrings(string_array) {
      // asm/index/addStrings(~lib/array/Array<~lib/string/String>) => void
      string_array = __lowerArray((pointer, value) => { new Uint32Array(memory.buffer)[pointer >>> 2] = __lowerString(value) || __notnull(); }, 7, 2, string_array) || __notnull();
      exports.addStrings(string_array);
    },
    addNumbers(number_array) {
      // asm/index/addNumbers(~lib/array/Array<f32>) => void
      number_array = __lowerArray((pointer, value) => { new Float32Array(memory.buffer)[pointer >>> 2] = value; }, 8, 2, number_array) || __notnull();
      exports.addNumbers(number_array);
    },
    addString(string) {
      // asm/index/addString(~lib/string/String) => void
      string = __lowerString(string) || __notnull();
      exports.addString(string);
    },
    addGroup(group) {
      // asm/index/addGroup(asm/index/Group) => void
      group = __lowerRecord9(group) || __notnull();
      exports.addGroup(group);
    },
  }, exports);
  function __lowerRecord5(value) {
    // asm/index/SectionParams
    // Hint: Opt-out from lowering as a record by providing an empty constructor
    if (value == null) return 0;
    const pointer = exports.__pin(exports.__new(4, 5));
    new Uint8Array(memory.buffer)[pointer + 0 >>> 0] = value.is_public ? 1 : 0;
    new Uint8Array(memory.buffer)[pointer + 1 >>> 0] = value.no_log ? 1 : 0;
    new Uint8Array(memory.buffer)[pointer + 2 >>> 0] = value.no_list ? 1 : 0;
    new Uint8Array(memory.buffer)[pointer + 3 >>> 0] = value.cache ? 1 : 0;
    exports.__unpin(pointer);
    return pointer;
  }
  function __lowerRecord9(value) {
    // asm/index/Group
    // Hint: Opt-out from lowering as a record by providing an empty constructor
    if (value == null) return 0;
    const pointer = exports.__pin(exports.__new(8, 9));
    new Uint32Array(memory.buffer)[pointer + 0 >>> 2] = __lowerArray((pointer, value) => { new Int32Array(memory.buffer)[pointer >>> 2] = value; }, 10, 2, value.order) || __notnull();
    new Uint32Array(memory.buffer)[pointer + 4 >>> 2] = __lowerArray((pointer, value) => { new Int32Array(memory.buffer)[pointer >>> 2] = value; }, 10, 2, value.map) || __notnull();
    exports.__unpin(pointer);
    return pointer;
  }
  function __liftString(pointer) {
    if (!pointer) return null;
    const
      end = pointer + new Uint32Array(memory.buffer)[pointer - 4 >>> 2] >>> 1,
      memoryU16 = new Uint16Array(memory.buffer);
    let
      start = pointer >>> 1,
      string = "";
    while (end - start > 1024) string += String.fromCharCode(...memoryU16.subarray(start, start += 1024));
    return string + String.fromCharCode(...memoryU16.subarray(start, end));
  }
  function __lowerString(value) {
    if (value == null) return 0;
    const
      length = value.length,
      pointer = exports.__new(length << 1, 1) >>> 0,
      memoryU16 = new Uint16Array(memory.buffer);
    for (let i = 0; i < length; ++i) memoryU16[(pointer >>> 1) + i] = value.charCodeAt(i);
    return pointer;
  }
  function __lowerArray(lowerElement, id, align, values) {
    if (values == null) return 0;
    const
      length = values.length,
      buffer = exports.__pin(exports.__new(length << align, 0)) >>> 0,
      header = exports.__pin(exports.__new(16, id)) >>> 0,
      memoryU32 = new Uint32Array(memory.buffer);
    memoryU32[header + 0 >>> 2] = buffer;
    memoryU32[header + 4 >>> 2] = buffer;
    memoryU32[header + 8 >>> 2] = length << align;
    memoryU32[header + 12 >>> 2] = length;
    for (let i = 0; i < length; ++i) lowerElement(buffer + (i << align >>> 0), values[i]);
    exports.__unpin(buffer);
    exports.__unpin(header);
    return header;
  }
  function __notnull() {
    throw TypeError("value must not be null");
  }
  return adaptedExports;
}
