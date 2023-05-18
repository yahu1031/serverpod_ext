import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { readdir } from 'fs/promises';
import { join, sep } from 'path';
import * as vscode from 'vscode';
import { parse } from 'yaml';
import { Constants } from '../../utils/constants.util';
import { LogCategory } from '../../utils/enums.util';
import { ExtLogger } from '../../utils/logger.util';
import { Utils } from './../../utils/utils.util';
import { ServerpodInterface } from './../interfaces/serverpod.interface';
import { Flutter } from './flutter.class';

var _generateSpawn: ChildProcessWithoutNullStreams | undefined;

export class Serverpod implements ServerpodInterface {
    /**
     * Private ExtensionContext
     */
    private context: vscode.ExtensionContext;

    private logger: ExtLogger = new ExtLogger(LogCategory.serverpod);

    /**
     * Constructor for the serverpod class
     */
    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this._utils = new Utils(context);
        this._flutter = new Flutter(context);
    }

    private _generateSpawn: ChildProcessWithoutNullStreams | undefined;

    private projPath: string | undefined;

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
    private _channel: vscode.OutputChannel | undefined;

    /**
     * Generates the Endpoints and client code for the serverpod project
     * 
     * {@link https://docs.serverpod.dev/concepts/working-with-endpoints Learn more about endpoints}
     * */
    async generateServerpodCode(): Promise<void> {
        const generateServerpodCodeArgs: string[] = [];
        var options = Constants.genQuickPicks;
        if (this._generateSpawn) {
            options[1].label = 'Stop Watching';
            options[1].detail = 'Stop generating the necessary files when changes are made.';
        }
        const option = await vscode.window.showQuickPick(options, { ignoreFocusOut: true });
        if (!option) { return; }
        generateServerpodCodeArgs.push('generate');
        if (option === options[1] && this._generateSpawn) {
            await this.stopGenerating();
            return;
        } else if (option === options[1] && !this._generateSpawn) {
            generateServerpodCodeArgs.push('--watch');
        } else if (this._generateSpawn && option === options[0]) {
            await vscode.window.showErrorMessage('Already generating....');
            return;
        }
        this._generateSpawn = spawn(Constants.serverpodApp, generateServerpodCodeArgs, { cwd: this._utils.serverPath, detached: false });
        _generateSpawn = this._generateSpawn;
        if (!this._channel) {
            this._channel = Constants.channel;
        }
        this._channel.show();
        this._channel.clear();
        await vscode.window.withProgress({
            title: "Serverpod",
            location: vscode.ProgressLocation.Notification,
            cancellable: false,
        }, async (progress, _token) => {
            progress.report({ message: "Generating Serverpod API code..." });
            if (this._generateSpawn) {
                this._generateSpawn.stdout?.on('data', (data) => {
                    this._channel?.appendLine(data.toString());
                });
                this._generateSpawn.stderr?.on('data', (data) => {
                    this._channel?.appendLine(data.toString());
                });
                this._generateSpawn.on('exit', (_, __) => {
                    this._channel?.appendLine(`Serverpod code generation exited`);
                });
                this._generateSpawn.on('close', (code) => {
                    this._generateSpawn = undefined;
                    _generateSpawn = undefined;
                });
            }
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
            if (!this._channel) {
                this._channel = Constants.channel;
            }
            this._channel.show();
            const cancellationTokenSource = new vscode.CancellationTokenSource();
            try {
                await vscode.window.withProgress({
                    title: "Serverpod",
                    location: vscode.ProgressLocation.Notification,
                    cancellable: false,
                }, async (progress, _token) => {
                    _token.onCancellationRequested(() => {
                        this._channel?.hide();
                        cancellationTokenSource.cancel();
                    });
                    progress.report({ message: 'Creating project...' });
                    const p = await new Promise<void>(async (resolve, reject) => {
                        let _dockerExists: boolean = false;
                        spawn('which', ['docker'], { detached: false }).on('close', async (code) => {
                            _dockerExists = code === 0;
                            if (_dockerExists) {
                                this.logger.info('createServerpodFlutterProject', '🐳 Docker found');
                                // check if docker is running
                                if (!Utils.isDockerRunning) {
                                    // await vscode.window.showErrorMessage('🐳 Docker is not running. Please start docker and try again.');
                                    _isError = true;
                                    reject(new Error('Docker is not running. Please start docker and try again.'));
                                }
                            }
                            else {
                                this.logger.error('createServerpodFlutterProject', '🐳 Docker not found. Please install docker to continue.');
                                _isError = true;
                            }
                        });
                        const newProjSpawn = spawn(Constants.serverpodApp, cmdArgs, { cwd: _path, detached: false });
                        newProjSpawn.stdout.on('data', async (data) => {
                            if (!force && data.toString().includes('You can still create this project by passing -f to "serverpod create".')) {
                                // this._channel?.hide();
                                _isError = true;
                                const dockerErrorOption: string[] = [_dockerExists ? 'Continue' : 'Install', _dockerExists ? 'Cancel' : 'continue'];
                                vscode.window.showWarningMessage(_dockerExists ? 'Docker is not running. Please start docker and try again.' : 'Looks like you didn\'t install docker.', ...dockerErrorOption).then(async (value) => {
                                    if (!_dockerExists && value === dockerErrorOption[0]) {
                                        const _opened = await vscode.env.openExternal(vscode.Uri.parse('https://www.docker.com/get-started'));
                                        _opened ? this.logger.info('createServerpodFlutterProject', '🐳 Opened https://www.docker.com/get-started') : this.logger.error('createServerpodFlutterProject', '🐳 Failed to open https://www.docker.com/get-started');
                                        resolve();
                                    } else if ((_dockerExists && value === dockerErrorOption[0]) || (!_dockerExists && dockerErrorOption[1])) {
                                        _isError = true;
                                        process.kill(-newProjSpawn.pid);
                                        newProjSpawn.kill('SIGKILL');
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
                                        newProjSpawn.kill('SIGKILL');
                                        this._channel?.hide();
                                        resolve();
                                    }
                                });
                                resolve();
                            }
                            this._channel?.append(data.toString());
                        });
                        newProjSpawn.stdout.on('close', async () => {
                            this._channel?.hide();
                            resolve();
                        });
                        newProjSpawn.stderr.on('error', async (err) => {
                            this.logger.error('createServerpodFlutterProject', `💔 ${err}`);
                            this._channel?.append(err.toString());
                            reject();
                        });
                    });
                    return p;
                }).then(async () => {
                    if (!_isError && existsSync(join(_path, _name!))) {
                        this.logger.info('createServerpodFlutterProject', '✅ serverpod project created');
                        this._channel?.appendLine('Project created successfully');
                        this.logger.info('createServerpodFlutterProject', join(_path, _name!));
                        setTimeout(async () => {
                            await vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(join(_path, _name!)));
                        }, 100);
                    } else {
                        this.logger.error('createServerpodFlutterProject', '💔 Project creation failed');
                        this._channel?.appendLine('Project creation failed');
                    }
                    return Promise.resolve();
                }, async (res) => {
                    this._channel?.hide();
                    cancellationTokenSource.cancel();
                    this.logger.error('createServerpodFlutterProject', '💔 Project creation failed');
                    this._channel?.appendLine('Project creation failed');
                    await vscode.window.showErrorMessage(res.message, 'Open logs').then(async (value) => {
                        if (value === 'Open logs') {
                            this._channel?.show();
                        }
                    });
                    return;
                });
            } catch (error) {
                this.logger.error('createServerpodFlutterProject', `💔 ${error}`);
            }
            return;
        }
    }



    /**
     * Starts the serverpod server
     * */
    async startServerpodServer(): Promise<void> {
        this.logger.info('startServerpodServer', '🌐 Starting serverpod server ...');
        if (!this.projPath) {
            this.logger.error('startServerpodServer', '💔 Not a serverpod project');
            await vscode.window.showErrorMessage('Not a serverpod project');
            return;
        }
        var projNameSplitList = new Utils(this.context).projectPath?.uri.path.split(sep);
        if (!projNameSplitList) {
            this.logger.error('startServerpodServer', '💔 Not a serverpod project');
            await vscode.window.showErrorMessage('Not a serverpod project');
            return;
        }
        var containerRunning = Utils.isContainerRunning(projNameSplitList[projNameSplitList.length - 1]);
        if (!containerRunning) {
            this.logger.warn('startServerpodServer', '💔 Serverpod server is not running');
            await vscode.window.showWarningMessage('Can\'t start serverpod server. Did you forget to run Docker?');
            return;
        }
        if (this._utils.serverPath || this.projPath) {
            const launchConfig = Object.assign(
                {
                    name: 'Serverpod server',
                    noDebug: false,
                    request: "launch",
                    cwd: join("${workspaceFolder}", `${projNameSplitList[projNameSplitList.length - 1]}_server`),
                    type: "dart",
                    program: join("bin", "main.dart"),
                }
            );
            await vscode.commands.executeCommand('setContext', 'serverpod.serving', true);
            await this.context.globalState.update('serverpod.serving', true);
            await vscode.debug.startDebugging(this._utils.projectPath, launchConfig as vscode.DebugConfiguration);
        }
    }

    /**
     * Stop the client generation process
     * */
    public async stopGenerating(): Promise<boolean> {
        try {
            if (this._generateSpawn) {
                process.kill(-this._generateSpawn.pid, 'SIGKILL');
                this._generateSpawn.kill('SIGKILL');
                this._channel?.clear();
                this._generateSpawn = undefined;
                _generateSpawn = undefined;
            }
            if (_generateSpawn) {
                this.logger.warn('stopGenerating', '🚩 Killing generate spawn');
                process.kill(-_generateSpawn.pid, 'SIGKILL');
            }
            return true;
        } catch (error) {
            vscode.window.showErrorMessage('Failed to stop client generation. Try again or restart VSCode', 'Restart VSCode').then(async (value) => {
                console.error(error);
                if (value === 'Restart VSCode') {
                    vscode.commands.executeCommand('workbench.action.reloadWindow');
                }
            });
            return false;
        }
    }


    /**
     * Stop the Serverpod server
     * */
    public async stopServer(): Promise<boolean> {
        try {
            if (vscode.debug.activeDebugSession) {
                await vscode.commands.executeCommand('setContext', 'serverpod.serving', false);
                await this.context.globalState.update('serverpod.serving', false);
                await vscode.debug.stopDebugging();
            }
            return true;
        } catch (error) {
            vscode.window.showErrorMessage('Failed to stop Server. Try again or restart VSCode', 'Restart VSCode').then(async (value) => {
                console.error(error);
                if (value === 'Restart VSCode') {
                    vscode.commands.executeCommand('workbench.action.reloadWindow');
                }
            });
            console.error(error);
            return false;
        }
    }

    async setServerpodPathIfNotExists(): Promise<string | undefined> {
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
        if (!this._utils) { return; }
        let input: string | undefined;
        if (!this._utils.serverPath) {
            input = await vscode.window.showQuickPick(folders, {
                matchOnDetail: true,
                ignoreFocusOut: true,
                placeHolder: this._utils.serverPath ? 'Select the server folder' : 'Select the project folder',
                canPickMany: false,
                title: 'Select the server folder',
            });
            if (!input) { return; }
        }
        return input;
    }

    /**
     * Check if project is a serverpod project
     * */
    public async isServerpodProject(): Promise<string | undefined> {
        const folder = this._utils.projectPath;
        let serverpodProj: string | undefined;
        if (!folder) {
            return Promise.resolve(serverpodProj);
        } else {
            const getDirectories = async (source: string): Promise<string[]> =>
                (await readdir(source, { withFileTypes: true }))
                    .map(dirent => dirent.name);
            var dirs = await getDirectories(folder.uri.fsPath);
            dirs.forEach(dir => {
                // check if there is any pubspec.yaml file
                if (dir === 'pubspec.yaml') {
                    const doc: any = parse(readFileSync(join(folder.uri.fsPath, dir), 'utf8'));
                    if (doc.dependencies?.serverpod || doc.dependencies?.serverpod_flutter || doc.dependencies?.serverpod_client) {
                        serverpodProj = folder.uri.fsPath;
                        return Promise.resolve(serverpodProj);
                    }
                }
                else if (!dir.startsWith('.')) {
                    var _pubspecPath: string = join(folder.uri.fsPath, dir, 'pubspec.yaml');
                    var yamlExists = existsSync(_pubspecPath);
                    var genExists = existsSync(join(folder.uri.fsPath, dir, 'generated'));
                    if (yamlExists && genExists) {
                        const doc: any = parse(readFileSync(_pubspecPath, 'utf8'));
                        if (doc.dependencies?.serverpod || doc.dependencies?.serverpod_flutter || doc.dependencies?.serverpod_client) {
                            serverpodProj = join(folder.uri.fsPath, dir);
                        }
                    }
                }
            });
            return Promise.resolve(serverpodProj);
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
        this.projPath = await this.isServerpodProject();
        this._utils.setServerPath = this.projPath;
        this.listenToDebugEvents();
        await vscode.commands.executeCommand('setContext', Constants.isServerpodProj, this.projPath ? true : false);
        await this.context.globalState.update(Constants.isServerpodProj, this.projPath ? true : false);
        await vscode.commands.executeCommand('setContext', 'serverpod.serving', this.projPath ? false : undefined);
        await this.context.globalState.update('serverpod.serving', this.projPath ? false : undefined);
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
                this._flutter.setFlutterPath = _p;
                this.logger.info('init', `🩵 Flutter path: ${_p}`);
                this._flutter.setDartPath = join(_p, 'cache', 'dart-sdk');
                this.logger.info('init', `💙 Dart path: ${this._flutter.dartPath}`);
            }
            if (Constants.isWindows ? _p.includes(join('pub', 'cache')) : _p.includes('.pub-cache')) {
                this.logger.info('init', `🧡 Pub cache path: ${_p}`);
                this._flutter.setPubCachePath = _p;
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

    /**
     * Listen to debug events
     * */
    public listenToDebugEvents(): void {
        var a = vscode.debug.onDidChangeActiveDebugSession(async (session) => {
            if (session && session.configuration && session.configuration.cwd.endsWith('_server')) {
                await vscode.commands.executeCommand('setContext', 'serverpod.serving', true);
                await this.context.globalState.update('serverpod.serving', true);
            } else {
                await vscode.commands.executeCommand('setContext', 'serverpod.serving', false);
                await this.context.globalState.update('serverpod.serving', false);
            }
        });
    }
}