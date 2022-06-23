declare namespace __AdaptedExports {
  /**
   * asm/index/addSection
   * @param name `~lib/string/String`
   * @param id `i32`
   * @param index `i32`
   */
  export function addSection(name: string, id: number, index: number): void;
  /**
   * asm/index/addParams
   * @param parameters `asm/index/SectionParams`
   */
  export function addParams(parameters: __Record5<undefined>): void;
  /**
   * asm/index/addStrings
   * @param string_array `~lib/array/Array<~lib/string/String>`
   */
  export function addStrings(string_array: Array<string>): void;
  /**
   * asm/index/addNumbers
   * @param number_array `~lib/array/Array<f32>`
   */
  export function addNumbers(number_array: Array<number>): void;
  /**
   * asm/index/addString
   * @param string `~lib/string/String`
   */
  export function addString(string: string): void;
  /**
   * asm/index/addNumber
   * @param number `f32`
   */
  export function addNumber(number: number): void;
  /**
   * asm/index/addGroup
   * @param group `asm/index/Group`
   */
  export function addGroup(group: __Record9<undefined>): void;
}
/** asm/index/SectionParams */
declare interface __Record5<TOmittable> {
  /** @type `bool` */
  is_public: boolean | TOmittable;
  /** @type `bool` */
  no_log: boolean | TOmittable;
  /** @type `bool` */
  no_list: boolean | TOmittable;
  /** @type `bool` */
  cache: boolean | TOmittable;
}
/** asm/index/Group */
declare interface __Record9<TOmittable> {
  /** @type `~lib/array/Array<i32>` */
  order: Array<number>;
  /** @type `~lib/array/Array<i32>` */
  map: Array<number>;
}
/** Instantiates the compiled WebAssembly module with the given imports. */
export declare function instantiate(module: WebAssembly.Module, imports: {
  env: unknown,
}): Promise<typeof __AdaptedExports>;
