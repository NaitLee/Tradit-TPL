
import * as fs from 'fs';
import { CFG_KEY_DEBUG, CFG_KEY_LANG, DEF_LANG, PLUGIN_PATH, WASM_PATH } from './tradit-constants';
import { instantiate, __AdaptedExports } from './tradit-wasm';
import { i18n } from './i18n';

export var HFS: HFS<typeof fs>;
export var Plugin: HFSPlugin;
export var API: PluginAPI;
export var Debug: number;
export var Wasm: typeof __AdaptedExports;
export var Log: Logger;
export var Locales: {
    supported: string[];
    aliases: {
        [key: string]: string;
    };
};
export var Unsubscribers: Unsubscriber[] = [];

class Logger {
    record: Set<string>;
    constructor() {
        this.record = new Set<string>();
    }
    log(message: string, things?: any, once = false) {
        if (once && this.record.has(message)) return;
        if (once) this.record.add(message);
        API.log(i18n(message, things));
    }
    note(message: string, things?: any, once = true) {
        if (once && this.record.has(message)) return;
        if (once) this.record.add(message);
        API.log(i18n('note-0', [i18n(message, things)]));
    }
    warn(message: string, things?: any, once = false) {
        if (once && this.record.has(message)) return;
        if (once) this.record.add(message);
        API.log(i18n('warning-0', [i18n(message, things)]));
    }
    error(message: string, things?: any) {
        API.log(i18n('error-0', [i18n(message, things)]));
    }
}

export async function globalInit(plugin: HFSPlugin, api: PluginAPI) {
    // stuffs
    Plugin = plugin;
    API = api;
    Debug = api.getConfig(CFG_KEY_DEBUG);
    HFS = {
        file_list: api.require('./api.file_list').file_list,
        fs: api.require('fs')
    };
    // language support
    let language: string = api.getConfig(CFG_KEY_LANG);
    i18n.add(DEF_LANG, JSON.parse(
        HFS.fs.readFileSync(PLUGIN_PATH + `lang/${DEF_LANG}.json`, 'utf-8')
    ));
    Unsubscribers.push(api.subscribeConfig(CFG_KEY_LANG, value => {
        language = value;
        if (language && language !== DEF_LANG &&
                HFS.fs.existsSync(PLUGIN_PATH + `lang/${language}.json`)) {
            //@ts-ignore
            i18n.add(language, JSON.parse(
                HFS.fs.readFileSync(
                    PLUGIN_PATH + `lang/${language}.json`, 'utf-8')
            ), true);
            //@ts-ignore
            i18n.useLanguage(language);
        }
    }));
    Locales = JSON.parse(HFS.fs.readFileSync(PLUGIN_PATH + 'lang/list.json', 'utf-8'));
    Log = new Logger();
    // WebAssembly module
    //@ts-ignore
    Wasm = await instantiate(await WebAssembly.compile(HFS.fs.readFileSync(WASM_PATH)));
}
