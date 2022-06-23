
///<reference path="i18n.ts" />

export const I18nExtensions = (function() {

    var registers = {
        'en-US': English,
        'zh-CN': Chinese
    };

    /**
     * Here's especially useful for showing what can be done!
     * @type {ExtensionOf<'en-US'>}
     */
    function English(things, conditions) {
        if (typeof conditions === 'string')
            return conditions;
        for (let key in things) {
            let value = things[key];
            if (typeof value === 'number') {
                if (conditions['nth']) {
                    // You can also replace what would be shown!
                    if (value < 10 || value > 20) {
                        if (value % 10 === 1) things[key] = value + 'st';
                        else if (value % 10 === 2) things[key] = value + 'nd';
                        else if (value % 10 === 3) things[key] = value + 'rd';
                        else things[key] = value + 'th';
                    } else things[key] = value + 'th';
                    return conditions['nth'];
                } else {
                    if (value == 1) return conditions['single'];
                    else return conditions['multiple'];
                }
            } else {
                if (conditions['an']) {
                    if ('aeiouAEIOU'.includes(value[0]))
                        things[key] = 'an ' + things[key];
                    else things[key] = 'a ' + things[key];
                    return conditions['an'];
                }
            }
        }
    }

    /**
     * @type {ExtensionOf<'zh-CN'>}
     */
    function Chinese(things, conditions) {
        if (typeof conditions === 'string')
            return conditions;
    }

    return registers;

})();
