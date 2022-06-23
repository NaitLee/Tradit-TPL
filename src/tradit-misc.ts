
import { ItemRole, MacroMarker, PATH_DELIM } from "./tradit-constants";

export function makePathConsistent(path: string) {
    return path.replaceAll(process.platform === 'win32' ? '/' : '\\', PATH_DELIM);
}

export function objectToMap<T>(object: { [key: string]: T }): Map<string, T> {
    let map = new Map<string, T>();
    for (let key in object) {
        map.set(key, object[key]);
    }
    return map;
}

export function groupToString(rootid: number, template: TemplateStage2) {
    // NOT USEFUL AND BROKEN
    function recurse(id: number) {
        let group = template.groups[id];
        let map = template.groupMaps[id];
        let result: string[] = [];
        let item: number;
        for (let i = 0; i < group.length; i++) {
            item = group[i];
            switch (map[i]) {
                case ItemRole.Plain:
                    result.push(template.strings[item]);
                    break;
                case ItemRole.PopCount:
                    if (item !== 0) {
                        result.splice(item - 1, 0, MacroMarker.Open);
                        result.push(MacroMarker.Close);
                    }
                    break;
                case ItemRole.Group:
                    result.push(...recurse(item));
                    break;
            }
        }
        return result;
    }
    return recurse(rootid).join(MacroMarker.Sep);
}
