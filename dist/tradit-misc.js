"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupToString = exports.makePathConsistent = void 0;
const tradit_constants_1 = require("./tradit-constants");
function makePathConsistent(path) {
    return path.replaceAll(process.platform === 'win32' ? '/' : '\\', tradit_constants_1.PATH_DELIM);
}
exports.makePathConsistent = makePathConsistent;
function groupToString(rootid, template) {
    // NOT USEFUL AND BROKEN
    function recurse(id) {
        let group = template.groups[id];
        let map = template.group_maps[id];
        let result = [];
        let item;
        for (let i = 0; i < group.length; i++) {
            item = group[i];
            switch (map[i]) {
                case tradit_constants_1.ItemRole.Plain:
                    result.push(template.strings[item]);
                    break;
                case tradit_constants_1.ItemRole.PopCount:
                    if (item !== 0) {
                        result.splice(item - 1, 0, tradit_constants_1.MacroMarker.Open);
                        result.push(tradit_constants_1.MacroMarker.Close);
                    }
                    break;
                case tradit_constants_1.ItemRole.Group:
                    result.push(...recurse(item));
                    break;
            }
        }
        return result;
    }
    return recurse(rootid).join(tradit_constants_1.MacroMarker.Sep);
}
exports.groupToString = groupToString;
//# sourceMappingURL=tradit-misc.js.map