import { exec, execSync, spawn } from 'child_process';
import { existsSync } from 'fs';
import * as os from 'os';
import { join } from 'path';
import * as vscode from 'vscode';
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
        new ExtLogger(LogCategory.extension).warn('killPid', "🚩 Killing PID " + pid);
        if (Constants.isWindows) {
            return execSync(`taskkill /F /PID ${pid}`, { encoding: "utf-8" });
        } else {
            var ex = exec(`kill ${pid}`);
            return ex.exitCode?.toString() ?? 'hey';
        }
    }

    /**
     * This function checks if the docker daemon is running
     * @returns true if the docker daemon is running
     * */
    static get isDockerRunning(): boolean {
        // check if the docker daemon is running
        try {
            var a = execSync('docker ps', { encoding: 'utf-8' });
            new ExtLogger(LogCategory.utils).info('isDockerRunning', a);
            return true;
        } catch (error) {
            new ExtLogger(LogCategory.utils).error('isDockerRunning', error);
            return false;
        }
    }

    /**
     * Check if docker container is running
     * @param containerName the name of the container to check
     * @returns true if the container is running
     * */
    static isContainerRunning(containerName: string): boolean {
        try {
            var res = execSync(`docker ps -f name=${containerName}`, { encoding: 'utf-8' });
            // check if the containers have containerName in their name
            new ExtLogger(LogCategory.utils).info('isContainerRunning', res);
            const isRunning = res.includes(containerName);
            return isRunning;
        } catch (error) {
            new ExtLogger(LogCategory.utils).error('isContainerRunning', error);
            return false;
        }
    }

    /**
     * Start a docker container
     * @param containerName the name of the container to start
     * @returns true if the container is started
     */
    static startContainer(serverPath: string, onErr: (err: any) => void): boolean {
        try {
            var res = spawn('docker-compose', ['up', '--build', '--detach'], {
                cwd: serverPath,
                detached: false,
            });
            res.on('error', (err) => {
                new ExtLogger(LogCategory.utils).error('startContainer', err);
                onErr(err);
                return false;
            });
            res.stdout.on('data', (data) => {
                new ExtLogger(LogCategory.utils).info('startContainer', data);
            });
            res.stderr.on('data', (data) => {
                new ExtLogger(LogCategory.utils).error('startContainer', data);
                onErr(data);
                return false;
            });
            // res.on('close', (code) => {
            //     new ExtLogger(LogCategory.utils).info('startContainer', `child process exited with code ${code}`);
            //     return true;
            // });
            return true;
        } catch (error) {
            new ExtLogger(LogCategory.utils).error('startContainer', error);
            onErr(error);
            return false;
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