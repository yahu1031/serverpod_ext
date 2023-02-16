import { exec, execSync, spawn } from 'child_process';
import { existsSync } from 'fs';
import { writeFile } from 'fs/promises';
import * as os from 'os';
import { join } from 'path';
import * as vscode from 'vscode';
import { TfPlanner } from '../base/classes/tf.plan.class';
import { ResourceId, Warning } from '../base/interfaces/tf.plan.interface';
import { Constants } from './constants.util';
import { LogCategory } from './enums.util';
import { ExtLogger } from './logger.util';

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

    private static logger: ExtLogger = new ExtLogger(LogCategory.utils);

    public static promiseWrapper = (fn: Function) =>
        new Promise((resolve, reject) => {
            try {
                const result = fn();
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });


    /**
     * This function shows a quick path pick with the given options
     * @returns the path of the selected folder
     */
    public static async pickPath(): Promise<string | undefined> {
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
    public static validateProjectName(name: string, path: string): string | undefined {
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
    public static killPid(pid: string): string {
        console.log("Killing PID " + pid);
        if (Constants.isWindows) {
            return execSync(`taskkill /F /PID ${pid}`, { encoding: "utf-8" });
        } else {
            var ex = exec(`kill ${pid}`);
            return ex.exitCode?.toString() ?? 'hey';
        }
    }

    // getter for the server path
    public get serverPath(): string | undefined {
        return this.context?.globalState.get(Constants.extensionServerPath);
    }

    // setter for the server path
    public set setServerPath(path: string | undefined) {
        this.context?.globalState.update(Constants.extensionServerPath, path);
    }

    // get project path
    public static get projectPath(): vscode.WorkspaceFolder | undefined {
        return vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0] : undefined;
    }

    public static async runSpawnAsync(command: string, args: string[]): Promise<any> {
        return new Promise((resolve, reject) => {
            let output = '';
            const child = spawn(command, args);
            child.stdout.on('data', (data) => {
                output += data.toString();
            });
            child.stderr.on('data', (data) => {
                output += data.toString();
            });
            child.on('close', (code) => {
                if (code === 0) {
                    resolve(code);
                } else {
                    reject(code);
                }
            });
        });
    }

    public static async runExecAsync(command: string, cwd?: string, execEnv?: { [key: string]: string }): Promise<any> {
        return new Promise((resolve, reject) => {
            const env = { ...process.env, ...execEnv };
            exec(command,
                { env, cwd }, (error, stdout, stderr) => {
                    if (error || stderr) {
                        reject(error);
                    }
                    resolve(stdout);
                });
        });
    };

    public static async refreshSystemPath(): Promise<void> {
        await this.runSpawnAsync('source', ['~/.bash_profile', '~/.bashrc', '~/.zshrc']).then(async (_) => {
            await vscode.window.showInformationMessage('Environment refreshed');
        }).catch(async (err) => {
            await vscode.window.showErrorMessage('Error refreshing environment');
            console.log(err);
        });
    }

    public static async openInBrowser(url: string): Promise<void> {
        await vscode.env.openExternal(vscode.Uri.parse(url));
        console.log('Opening in browser: ' + url);
    }

    /**
     * `.tfvar` parser
     * @param {string} data
     * @returns {any[]} parsed data
     * */
    public static tfParser(data: string): { name: string, value: any }[] {
        const tfvars = data.split('\n');
        const tfvarsParsed: { name: string, value: any }[] = [];
        tfvars.forEach(line => {
            const [name, valueString] = line.startsWith('#') || line.length === 0 ? [line, ''] : line.split('=') as any[];
            let value;
            if (valueString === 'true' || valueString === 'false' || valueString === '"true"' || valueString === '"false"') {
                value = valueString === 'true' || valueString === '"true"';
            } else if (!isNaN(valueString) && valueString !== '') {
                value = parseFloat(valueString);
            } else {
                value = valueString;
            }
            tfvarsParsed.push({ name, value });
        });
        return tfvarsParsed;
    }

    /**
     * Write terraform variables to the file
     * @param {string} path
     * @param {any[]} configs
     * @returns {Promise<boolean>} true if successful
     * */
    public static async writeTerraformVars(path: string, configs: { name: string, value: any }[]): Promise<boolean> {
        let tfvars = '';
        try {
            configs.forEach(config => {
                try {
                    tfvars += config.name.length === 0 ? '\n' : config.name.startsWith('#') ? `${config.name}\n` : `${config.name}=  ${typeof (config.value) === 'string' ? config.value.trim() : config.value}\n`;
                } catch (error) {
                    this.logger.error(error);
                    return Promise.reject(false);
                }
            });
            await writeFile(path, tfvars, 'utf-8');
            return Promise.resolve(true);
        } catch (e) {
            this.logger.error(e);
            return Promise.reject(false);
        }
    }

}