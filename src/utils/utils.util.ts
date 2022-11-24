import { existsSync } from 'fs';
import * as os from 'os';
import { join } from 'path';
import { ExtensionContext, Uri, window } from 'vscode';
import { Constants } from './constants.util';

export class Utils {


    /**
     * Private ExtensionContext
     */
     private context?: ExtensionContext;
 
     /**
      * Constructor for the Utils class
      */
    constructor(context: ExtensionContext) { 
        this.context = context;
    }
 
    /**
     * This function shows a quick path pick with the given options
     * @returns the path of the selected folder
     */
    static async pickPath(): Promise<string | undefined> {
        const folder: Uri[] | undefined = await window.showOpenDialog({
            canSelectFolders: true,
            defaultUri: Uri.file(os.homedir()),
            openLabel: 'Select a directory',
        });
        // remove the first '/' from the path
        return folder?.[0].fsPath;
    }

    /**
     * This function checks if the given path exists
     * @param name the name of the path
     * @param path the path to check
     * @returns the error message if the name is not valid or already exists
     * */
    static validateProjectName(name: string, path: string): string | undefined {
        const bannedNames: string[] = ['dart', 'test', 'serverpod', 'flutter', 'example', 'server', 'client'];
        if (name.length === 0) {
            return 'Project name cannot be empty';
        }
        if (!Constants.projectNameRegex.test(name)) {
            return 'Serverpod project names should be all lowercase, with underscores to separate words';
        }
        if (bannedNames.includes(name)) {
            return `You may not use ${name} as the name for a serverpod project`;
        }
        if (existsSync(join(path, name))) {
            return 'A project with this name already exists within the selected directory';
        }
    }

    // getter for the server path
    get serverPath(): string | undefined {
        return this.context?.globalState.get(Constants.extensionServerPath);
    }

    // setter for the server path
    set setServerPath(path: string | undefined) {
        this.context?.globalState.update(Constants.extensionServerPath, path);
      }
}