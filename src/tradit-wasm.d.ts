declare namespace __AdaptedExports {
  /**
   * asm/index/helloWorld
   * @returns `~lib/string/String`
   */
  export function helloWorld(): string;
  /**
   * asm/index/testArray
   * @param array `~lib/array/Array<i32>`
   * @returns `i32`
   */
  export function testArray(array: Array<number>): number;
  /**
   * asm/index/tryMacro
   * @param name `~lib/string/String`
   * @returns `bool`
   */
  export function tryMacro(name: string): boolean;
}
/** Instantiates the compiled WebAssembly module with the given imports. */
export declare function instantiate(module: WebAssembly.Module, imports: {
  env: unknown,
}): Promise<typeof __AdaptedExports>;
