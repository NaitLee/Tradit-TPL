
enum GroupMap {
    String,
    Number,
    Group,
    Exec,
    Pop,
}

class Group {
    order: i32[];
    map: GroupMap[];
}

class SectionParams {
    is_public: bool;
    no_log: bool;
    no_list: bool;
    cache: bool;
}

var sectionName2Id = new Map<string, i32>();
var sectionId2GroupIndex = new Map<i32, i32>();
var params = new Array<SectionParams>();
var strings = new Array<string>();
var numbers = new Array<f32>();
var groups = new Array<Group>();

export function addSection(name: string, id: i32, index: i32): void {
    sectionName2Id.set(name, id);
    sectionId2GroupIndex.set(id, index);
}
export function addParams(parameters: SectionParams): void {
    params.push(parameters);
}
export function addStrings(string_array: string[]): void {
    for (let i = 0; i < string_array.length; i++) {
        strings.push(string_array[i]);
    }
}
export function addNumbers(number_array: f32[]): void {
    for (let i = 0; i < number_array.length; i++) {
        numbers.push(number_array[i]);
    }
}
export function addString(string: string): void {
    strings.push(string);
}
export function addNumber(number: f32): void {
    numbers.push(number);
}
export function addGroup(group: Group): void {
    groups.push(group);
}
