import { existsSync } from 'fs';
import { readdir } from 'fs/promises';
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

    public async isServerpodProject(): Promise<string | undefined> {
        const folders = workspace.workspaceFolders;
        let serverpodProj: string | undefined;
        if (folders) {
            const folder = folders[0];
            const getDirectories = async (source: string): Promise<string[]> =>
            (await readdir(source, { withFileTypes: true }))
              .map(dirent => dirent.name);
            var dirs = await getDirectories(folder.uri.fsPath);
            dirs.forEach(dir => {
                if(!dir.startsWith('.')){
                    var yamlExists = existsSync(join(folder.uri.fsPath, dir, 'pubspec.yaml'));
                    var genExists = existsSync(join(folder.uri.fsPath, dir, 'generated'));
                    if(yamlExists && genExists){
                        serverpodProj = join(folder.uri.fsPath, dir);
                    }
                }
            });
        }
        return Promise.resolve(serverpodProj);
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
