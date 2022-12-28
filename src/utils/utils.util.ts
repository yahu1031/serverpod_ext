import { exec, execSync } from 'child_process';
import { existsSync } from 'fs';
import * as os from 'os';
import { join } from 'path';
import * as vscode from 'vscode';
import { Constants } from './constants.util';

export class Utils {


    /**
     * Private ExtensionContext
     */
    private context?: vscode.ExtensionContext;

    /**
     * Constructor for the Utils class
     */
    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    /**
     * This function shows a quick path pick with the given options
     * @returns the path of the selected folder
     */
    static async pickPath(): Promise<string | undefined> {
        const folder: vscode.Uri[] | undefined = await vscode.window.showOpenDialog({
            canSelectFolders: true,
            defaultUri: vscode.Uri.file(os.homedir()),
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

    /**
     * Kill a process by its pid
     * @param pid the pid of the process to kill
     * @returns the error message if the name is not valid or already exists
     * */
    static killPid(pid: string): string {
        console.log("Killing PID " + pid);
        if (Constants.isWindows) {
            return execSync(`taskkill /F /PID ${pid}`, { encoding: "utf-8" });
        } else {
            var ex = exec(`kill ${pid}`);
            return ex.exitCode?.toString() ?? 'hey';
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

    // get project path
    get projectPath(): vscode.WorkspaceFolder | undefined {
        return vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0] : undefined;
    }
}