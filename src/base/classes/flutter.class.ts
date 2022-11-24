import { existsSync, readFileSync } from 'fs';
import { readdir } from 'fs/promises';
import { parse } from 'yaml';
import { join } from 'path';
import { ExtensionContext, workspace } from 'vscode';
import { Constants } from '../../utils/constants.util';

export class Flutter {

    /**
     * Private ExtensionContext
     */
    private context?: ExtensionContext;

    /**
     * Constructor for the Flutter class
     */
    constructor(context: ExtensionContext) {
        this.context = context;
    }

    /**
     * Getter for flutter path
     */
    public get flutterPath(): string | undefined {
        return this.context?.globalState.get(Constants.extensionFlutterPathKey);
    }

    /**
     * @param {string} path Pass the path to set flutter path for the extension
     */
    set setFlutterPath(path: string) {
        this._setPath(Constants.extensionFlutterPathKey, path);
    }

    /**
     * Getter for flutter path
     */
    public get dartPath(): string | undefined {
        return this.context?.globalState.get(Constants.extensionDartPathKey);
    }

    /**
     * @param {string} path Pass the path to set dart path for the extension
     */
    set setDartPath(path: string) {
        this._setPath(Constants.extensionDartPathKey, path);
    }


    /**
     * Getter for flutter path
     */
    public get pubCachePath(): string | undefined {
        return this.context?.globalState.get(Constants.extensionPubCachePathKey);
    }

    /**
     * @param {string} path Pass the path to set .pub-cache path for the extension
     */
    set setPubCachePath(path: string) {
        this._setPath(Constants.extensionPubCachePathKey, path);
    }

    

    /**
     * 
     * @param key - Pass the key of the path to set
     * @param path - Pass the path to set
     */
    private _setPath(key: string, path: string): void {
        const _p = key === Constants.extensionDartPathKey ? this.dartPath : key === Constants.extensionFlutterPathKey ? this.flutterPath : this.pubCachePath;
        if (!_p) {
            if (existsSync(path)) {
                this.context?.globalState.update(key, path);
            } else {
                throw new Error(`${path} does not exist`);
            }
        }
    }
}
