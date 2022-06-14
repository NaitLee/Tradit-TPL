
import { ItemRole } from "./tradit-constants";

/**
 * Input serialized template, give you *assemblized* data
 */
export function assemblize(serialized: SerializedTemplate): AssemblizedTemplate{
    let template: number[] = [];
    let sections: { [name: string]: number } = {};
    let params: {
        public?: boolean;
        no_log?: boolean;
        no_list?: boolean;
        cache?: boolean;
    }[] = [];
    let strings: string[] = [];
    let groups: MacroSegmentAssemblized[] = [];
    let group_maps: ItemRole[][] = [];
    let string_map: { [key: string]: number } = {};
    let count = [0, 0];
    function process(subgroup: MacroSegment[]) {
        let layer: MacroSegmentAssemblized = [];
        let layer_map: ItemRole[] = [];
        groups.push(layer);
        group_maps.push(layer_map);
        let layer_id = count[1]++;
        for (let item of subgroup) {
            switch (typeof item) {
                case 'number':
                    layer.push(item);
                    layer_map.push(ItemRole.PopCount);
                    break;
                case 'string':
                    if (!string_map[item]) {
                        string_map[item] = strings.push(item) - 1;
                    }
                    layer.push(string_map[item]);
                    layer_map.push(ItemRole.Plain);
                    break;
                case 'object':
                    layer.push(process(item));
                    layer_map.push(ItemRole.Group);
                    break;
            }
        }
        return layer_id;
    }
    for (let name in serialized) {
        let section = serialized[name];
        if (section.alias !== null && sections[section.alias] !== null) {
            sections[name] = sections[section.alias];
            continue;
        }
        let root_group = section.segments;
        if (!root_group) continue;
        params.push({
            no_log: section.params.includes('no log'),
            no_list: section.params.includes('no list'),
            cache: section.params.includes('cache'),
            public: section.params.includes('public') || name === '',
        });
        sections[name] = template.push(process(root_group)) - 1;
    }
    return {
        template: template,
        sections: sections,
        params: params,
        strings: strings,
        groups: groups,
        group_maps: group_maps,
    };
}
