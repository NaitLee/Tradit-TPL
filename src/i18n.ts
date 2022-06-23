import { I18nExtensions } from "./i18n-ext";

type DictOf<T> = { [key: string]: T };
type Conditions = DictOf<string>;
type ConditionsOf<K extends Languages> = AllConditions[K];
type LanguageData = DictOf<Conditions | string>;
type Things = { [index: number | string]: number | string | boolean | null } | Array<number | string>;
interface Extension {
    (things: Things, conditions: Conditions): string;
}
interface ExtensionOf<K extends Languages> {
    (things: Things, conditions: ConditionsOf<K> | string): string;
}
type Languages = keyof AllConditions;

/**
 * All known possible condition keys, per language
 × These are what will be used in langauge files
 * Please add more as you do in extensions
 */
type AllConditions = {
    'en-US': {
        'single': string,
        'multiple': string,
        'nth': string,
        'a': string,
        'an': string
    },
    'zh-CN': {
        'measure': string
    }
};

/**
 * Yet another i18n solution
 */
class I18n {
    database: DictOf<LanguageData>;
    extensions: DictOf<Extension>;
    language!: Languages;
    constructor(language: Languages = 'en-US') {
        this.database = {};
        this.extensions = {};
        this.useLanguage(language);
    }
    /**
     * Use this language as main language
     */
    useLanguage(language: Languages) {
        if (this.language)
            this.database[language] = this.database[this.language];
        if (!this.database[language])
            this.database[language] = {};
        this.language = language;
    }
    /**
     * Add data as corresponding language,
     * also to other (added) languages as fallback,
     * or override
     */
    add(language: Languages, data: LanguageData, override = false) {
        if (!this.database[language])
            this.database[language] = {};
        for (let key in data) {
            let value = data[key];
            this.database[language][key] = value;
            for (let lang in this.database)
                if (override || !this.database[lang][key])
                    this.database[lang][key] = value;
        }
    }
    /**
     * Use extension in the language
     */
    extend(language: Languages, extension: Extension) {
        this.extensions[language] = extension;
    }
    /**
     * Alias a language code to another, usually formal/more used/as fallback
     */
    alias(aliases: DictOf<Languages>) {
        for (let alt_code in aliases) {
            let code = aliases[alt_code];
            this.database[alt_code] = this.database[code];
            this.extensions[alt_code] = this.extensions[code];
        }
    }
    /**
     * Translate a string ("text"), using "things" such as numbers
     */
    translate(text: string, things: Things) {
        let conditions = this.database[this.language][text] || text;
        if (!things) return conditions as string;
        if (this.extensions[this.language])
            text = this.extensions[this.language](things, conditions as Conditions) as string;
        else text = conditions as string;
        for (let key in things) {
            text = text.replace(`{${key}}`, things[key]?.toString() ?? 'null');
        }
        return text;
    }
}

interface I18nCallable extends I18n {
    (text: string, things?: Things, can_change_things?: boolean): string;
}

/**
 * An i18n instance that is directly callable
 */
//@ts-ignore
export const i18n: I18nCallable = (function() {

    let instance = new I18n();

    let i18n_callable = function(text: string, things: Things) {
        return instance.translate.call(i18n_callable, text, things);
    }

    Object.setPrototypeOf(i18n_callable, instance);

    if (typeof I18nExtensions === 'object') {
        for (let key in I18nExtensions)
            //@ts-ignore
            instance.extend(key, I18nExtensions[key]);
    }

    return i18n_callable;
})();
