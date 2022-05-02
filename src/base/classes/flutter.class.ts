import { existsSync } from 'fs';
import { ExtensionContext } from 'vscode';
import { Constants } from '../../utils/constants.util';

export class Flutter {

    /**
     * Private ExtensionContext
     */
    private static _context?: ExtensionContext;

    /**
    * private instance of the Flutter class
    */
    private static _instance: Flutter;

    /**
     * Constructor for the Flutter class
     */
    private constructor() { }

    /**
     * 
     * A singleton instance of the Flutter class
     */
    public static getInstance(context: ExtensionContext): Flutter {
        this._context = context;
        if (!Flutter._instance) {
            Flutter._instance = new Flutter();
        }
        return Flutter._instance;
    }

    /**
     * Getter for flutter path
     */
    public get flutterPath(): string | undefined {
        return Flutter._context?.globalState.get(Constants.extensionFlutterPathKey);
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
        return Flutter._context?.globalState.get(Constants.extensionDartPathKey);
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
        return Flutter._context?.globalState.get(Constants.extensionPubCachePathKey);
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
                Flutter._context?.globalState.update(key, path);
            } else {
                throw new Error(`${path} does not exist`);
            }
        }
    }
}