import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { readdir } from 'fs/promises';
import { join, sep } from 'path';
import * as vscode from 'vscode';
import { Constants } from '../../utils/constants.util';
import { Utils } from './../../utils/utils.util';
import { ServerpodInterface } from './../interfaces/serverpod.interface';
import { Flutter } from './flutter.class';
import path = require('path');

export class Serverpod implements ServerpodInterface {
    /**
     * Private ExtensionContext
     */
    private context: vscode.ExtensionContext;

    /**
     * Constructor for the serverpod class
     */
    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this._utils = new Utils(context);
        this._flutter = new Flutter(context);
    }


    /**
     * {@link Utils} class private instance
     * */
    private _utils: Utils;

    /**
     * {@link Flutter} class private instance
     * */
    private _flutter: Flutter;

    /**
     * {@link Constants.channel | Serverpod channel} private variable
     * */
    private _channel: vscode.OutputChannel = Constants.channel;

    /**
     * Generates the Endpoints and client code for the serverpod project
     * 
     * {@link https://docs.serverpod.dev/concepts/working-with-endpoints Learn more about endpoints}
     * */
    async generateServerpodCode(): Promise<void> {
        const generateServerpodCodeArgs: string[] = [];
        const option = await vscode.window.showQuickPick(Constants.genQuickPicks, { matchOnDetail: true });
        generateServerpodCodeArgs.push('generate');
        if (option === Constants.genQuickPicks[1]) {
            generateServerpodCodeArgs.push('--watch');
        }
        const wf = vscode.workspace.workspaceFolders;
        let folders: string[] = [];
        if (wf) {
            const getDirectories = async (source: string): Promise<string[]> =>
            (await readdir(source, { withFileTypes: true }))
              .filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('.'))
              .map(dirent => dirent.name);
            folders = await getDirectories(wf[0].uri.path);
            folders = folders.map((folder) => {
                return join(wf[0].uri.path, folder);
            });
        }
        if(!this._utils) {return;}
        let input: string | undefined;
        if(!this._utils.serverPath)
        {
            input = await vscode.window.showQuickPick(folders, { 
                matchOnDetail: true,
                placeHolder: this._utils.serverPath ? 'Select the server folder' : 'Select the project folder',
                canPickMany: false,
                title: 'Select the server folder',
            });
        }
        const generateSpawn = spawn(Constants.serverpodApp, generateServerpodCodeArgs, { cwd: this._utils.serverPath ?? input });
        this._channel.show();
        await vscode.window.withProgress({
            title: "Serverpod",
            location: vscode.ProgressLocation.Notification,
            cancellable: false,
        }, async (progress, _token) => {
            progress.report({ message: "Generating Serverpod API code..." });
            generateSpawn.stdout.on('data', (data) => {
                this._channel.appendLine(data.toString());
            });
            generateSpawn.stderr.on('data', (data) => {
                this._channel.appendLine(data.toString());
            });
            generateSpawn.on('close', (code) => {
                this._channel.appendLine(`child process exited with code ${code}`);
            });
        });
        return Promise.resolve();
    }

    /**
     * Creates a serverpod project(Dart project)
     * */
    async generateServerpodDartProject(): Promise<void> {
        vscode.window.showWarningMessage('Not yet implemented');
        return Promise.resolve();
    }

    /**
     * Creates a serverpod project(Flutter project)
     * */
    public async createServerpodFlutterProject(force?: boolean): Promise<void> {
        const cmdArgs: string[] = [];
        cmdArgs.push('create');
        if (force) {
            cmdArgs.push('--force');
        }
        const _path = await Utils.pickPath();
        if (!_path) {
            vscode.window.showErrorMessage('No path selected');
            return;
        }
        if (!existsSync(_path)) {
            vscode.window.showErrorMessage('Path doesn\'t exist.');
            return;
        }
        let _name: string | undefined;
        _name = await vscode.window.showInputBox({ placeHolder: 'mypod', value: 'mypod', ignoreFocusOut: true, title: 'Enter a name for your project', validateInput: (s) => Utils.validateProjectName(s, _path) });
        if (!_name) {
            vscode.window.showErrorMessage('No name entered');
            return;
        }
        else {
            let _isError: boolean = false;
            cmdArgs.push(_name);
            this._channel.show();
            await vscode.window.withProgress({
                title: "Serverpod",
                location: vscode.ProgressLocation.Notification,
                cancellable: false,
            }, async (progress, _token) => {
                progress.report({ message: 'Creating project...' });
                const p = await new Promise<void>(async (resolve, reject) => {
                    let _dockerExists: boolean = false;
                    spawn('which', ['docker']).on('close', async (code) => {
                        _dockerExists = code === 0;
                        if (_dockerExists) {
                            console.log('Docker found');
                        }
                        else {
                            await vscode.window.showErrorMessage('Docker not found. Please install docker to continue.');
                            _isError = true;
                        }
                    });
                    const newProjSpawn = spawn(Constants.serverpodApp, cmdArgs, { cwd: _path });
                    newProjSpawn.stdout.on('data', async (data) => {
                        if (!force && data.toString().includes('You can still create this project by passing -f to "serverpod create".')) {
                            this._channel.hide();
                            _isError = true;
                            const dockerErrorOption: string[] = [_dockerExists ? 'Continue' : 'Install', _dockerExists ? 'Cancel' : 'continue'];
                            vscode.window.showWarningMessage(_dockerExists ? 'Docker is not running. Please start docker and try again.' : 'Looks like you didn\'t install docker.', ...dockerErrorOption).then(async (value) => {
                                if (!_dockerExists && value === dockerErrorOption[0]) {
                                    const _opened = await vscode.env.openExternal(vscode.Uri.parse('https://www.docker.com/get-started'));
                                    console.log(`${_opened ? 'Opened' : 'Failed to open'} https://www.docker.com/get-started`);
                                    resolve();
                                } else if ((_dockerExists && value === dockerErrorOption[0]) || (!_dockerExists && dockerErrorOption[1])) {
                                    _isError = true;
                                    newProjSpawn.kill();
                                    await this.createServerpodFlutterProject(true).then(() => {
                                        console.warn('Force flag is used');
                                        resolve();
                                    }, () => {
                                        _isError = true;
                                        reject();
                                    });
                                    resolve();
                                } else if (!_dockerExists && value === dockerErrorOption[1]) {
                                    _isError = true;
                                    newProjSpawn.kill();
                                    this._channel.hide();
                                    resolve();
                                }
                            });
                            resolve();
                        }
                        console.log(data.toString());
                        this._channel.append(data.toString());
                    });
                    newProjSpawn.stdout.on('close', async () => {
                        console.log(`serverpod project creation closed with ${_isError}`);
                        resolve();
                    });
                    newProjSpawn.stderr.on('error', async (err) => {
                        console.error(err);
                        this._channel.append(err.toString());
                        this._channel.hide();
                        reject();
                    });
                });
                return p;
            }).then(async () => {
                if (!_isError && existsSync(join(_path, _name!))) {
                    console.log('serverpod project created');
                    this._channel.appendLine('Project created successfully');
                    console.log(join(_path, _name!));
                    setTimeout(async () => {
                        await vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(join(_path, _name!)));
                    }, 100);
                } else {
                    console.log('Project creation failed');
                    this._channel.appendLine('Project creation failed');
                }
                return Promise.resolve();
            }, () => {
                console.error('Failed');
                this._channel.appendLine('Project creation failed');
                vscode.window.showErrorMessage('Project creation failed');
                return;
            });
            console.log('Done outside');
            return;
        }
    }

    /**
     * Get the serverpod path
     * */
    public get getServerpodPath(): string | undefined {
        return this.context.globalState.get(Constants.extensionServerpodPathKey);
    }

    /**
     * @param {string} path Pass the path to set serverpod path for the extension
     */
    set setServerpodPath(path: string) {
        const _p = this.getServerpodPath;
        if (!_p) {
            if (existsSync(path)) {
                this.context.globalState.update(Constants.extensionServerpodPathKey, path);
            } else {
                throw new Error(`${path} does not exist`);
            }
        }
    }

    /**
     * 
     * Initialize the serverpod extension necessary paths
     * */
    public async init(): Promise<void> {
        this._utils.setServerPath = await this._flutter.isServerpodProject();
        const envPath = Constants.envPaths;

        if (!envPath) {
            console.error('Failed to fetch env paths');
            return;
        }
        /**
         * Set-up flutter paths
         */
        envPath.forEach(_p => {
            if (_p.endsWith(join('flutter', 'bin')) || _p.endsWith(join('flutter', 'bin', sep))) {
                console.log(_p);
                this._flutter.setFlutterPath = _p;
            }
            if (_p.endsWith(join('dart-sdk', 'bin')) || _p.endsWith(join('dart-sdk', 'bin', sep))) {
                console.log(_p);
                this._flutter.setDartPath = _p;
            }
            if (Constants.isWindows ? _p.includes(join('pub', 'cache')) : _p.includes('.pub-cache')) {
                console.log(_p);
                this._flutter.setPubCachePath = _p;
            }
            if (_p.endsWith(Constants.serverpodApp)) {
                console.log(_p);
                this.setServerpodPath = _p;
            }
        });

        /**
         * Set-up serverpod path
         */
        if (!this.getServerpodPath) {
            const _serverpodPath: string = join(this._flutter.pubCachePath!, Constants.isWindows ? 'serverod.bat' : 'serverpod');
            if (existsSync(_serverpodPath)) {
                this.setServerpodPath = this._flutter.pubCachePath!;
            }
        }
    }
}