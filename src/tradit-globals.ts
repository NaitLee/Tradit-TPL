
import * as fs from 'fs';
import { CFG_KEY_DEBUG } from './tradit-constants';

export var HFS: HFS<typeof fs>;
export var Plugin: HFSPlugin;
export var API: PluginAPI;
export var Debug: number;

export function init(plugin: HFSPlugin, api: PluginAPI) {
    Plugin = plugin;
    API = api;
    Debug = api.getConfig(CFG_KEY_DEBUG);
    HFS = {
        file_list: api.require('./api.file_list').file_list,
        fs: api.require('fs')
    };
}
