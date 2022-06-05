
import { ItemRole, MacroMarker } from "./tradit-constants";

export function groupToString(rootid: number, template: AssemblizedTemplate) {
    // NOT USEFUL AND BROKEN
    function recurse(id: number) {
        let group = template.groups[id];
        let map = template.group_maps[id];
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
