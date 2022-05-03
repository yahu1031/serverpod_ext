import { existsSync } from 'fs';
import { delimiter, join, sep } from 'path';
import { commands, ExtensionContext, OutputChannel, ProgressLocation, Uri, window, env } from 'vscode';
import { Constants } from '../../utils/constants.util';
import { Flutter } from './flutter.class';
import { ServerpodInterface } from './../interfaces/serverpod.interface';
import { Utils } from './../../utils/utils.util';
import { spawn } from 'child_process';

export class Serverpod implements ServerpodInterface {
    /**
     * Private ExtensionContext
     */
    private static _context?: ExtensionContext;

    /**
     * private instance of the serverpod class
     */
    private static _instance: Serverpod;

    /**
     * 
     * A singleton instance of the Serverpod class
     */
    public static getInstance(context: ExtensionContext): Serverpod {
        this._context = context;
        if (!Serverpod._instance) {
            Serverpod._instance = new Serverpod();
        }
        return Serverpod._instance;
    }

    /**
     * Constructor for the serverpod class
     */
    private constructor() { }


    /**
     * Generates the API code for the serverpod project
     * */
    async generateServerpodCode(): Promise<void> {
        await window.showWarningMessage('Not yet implemented');
        return Promise.resolve();
    }

    /**
     * Creates a serverpod project(Dart project)
     * */
    async generateServerpodDartProject(): Promise<void> {
        window.showWarningMessage('Not yet implemented');
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
        console.log(_path);
        if (!_path) {
            window.showErrorMessage('No path selected');
            return;
        }
        if (!existsSync(_path)) {
            window.showErrorMessage('Path doesn\'t exist.');
            return;
        }
        let _name: string | undefined;
        _name = await window.showInputBox({ placeHolder: 'dummy', value: 'dummy', ignoreFocusOut: true, title: 'Enter a name for your project', validateInput: (s) => Utils.validateProjectName(s, _path) });
        if (!_name) {
            window.showErrorMessage('No name entered');
            return;
        }
        else {
            let _isError: boolean = false;
            cmdArgs.push(_name);
            const _channel: OutputChannel = window.createOutputChannel("Serverpod");
            _channel.show();
            await window.withProgress({
                title: "Serverpod",
                location: ProgressLocation.Notification,
                cancellable: false,
            }, async (progress, _token) => {
                progress.report({ message: 'Creating project...' });
                const p = await new Promise<void>(async (resolve, reject) => {
                    let _dockerExists: boolean = false;
                    spawn('which', ['docker']).on('close', (code) => {
                        _dockerExists = code === 0;
                        if (_dockerExists) {
                            console.log('Docker found');
                        }
                        else {
                            console.log('Docker not installed');
                            _isError = true;
                        }
                    });
                    const a = spawn(Constants.serverpodApp, cmdArgs, { cwd: _path });
                    a.stdout.on('data', async (data) => {
                        if (!force && data.toString().includes('You can still create this project by passing -f to "serverpod create".')) {
                            _channel.hide();
                            _isError = true;
                            const dockerErrorOption: string[] = [_dockerExists ? 'Continue' : 'Install', _dockerExists ? 'Cancel' : 'continue'];
                            window.showWarningMessage(_dockerExists ? 'Docker is not running. Please start docker and try again.' : 'Looks like you didn\'t install docker.', ...dockerErrorOption).then(async (value) => {
                                if (!_dockerExists && value === dockerErrorOption[0]) {
                                    const _opened = await env.openExternal(Uri.parse('https://www.docker.com/get-started'));
                                    console.log(`${_opened ? 'Opened' : 'Failed to open'} https://www.docker.com/get-started`);
                                    resolve();
                                } else if ((_dockerExists && value === dockerErrorOption[0]) || (!_dockerExists && dockerErrorOption[1])) {
                                    _isError = true;
                                    a.kill();
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
                                    a.kill();
                                    _channel.hide();
                                    resolve();
                                }
                            });
                            resolve();
                        }
                        console.log(data.toString());
                        _channel.append(data.toString());
                    });
                    a.stdout.on('close', async () => {
                        console.log(`serverpod project creation closed with ${_isError}`);
                        resolve();
                    });
                    a.stderr.on('error', async (err) => {
                        console.error(err);
                        _channel.append(err.toString());
                        _channel.hide();
                        reject();
                    });
                });
                return p;
            }).then(async () => {
                if (!_isError) {
                    console.log('serverpod project created');
                    _channel.appendLine('Project created successfully');
                    console.log(join(_path, _name!));
                    setTimeout(async () => {
                        await commands.executeCommand("vscode.openFolder", Uri.file(join(_path, _name!)));
                    }, 100);
                } else {
                    console.log('Project creation failed');
                    _channel.appendLine('Project creation failed');
                }
                return Promise.resolve();
            }, () => {
                console.error('Failed');
                _channel.appendLine('Project creation failed');
                window.showErrorMessage('Project creation failed');
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
        return Serverpod._context?.globalState.get(Constants.extensionServerpodPathKey);
    }

    /**
     * @param {string} path Pass the path to set serverpod path for the extension
     */
    set setServerpodPath(path: string) {
        const _p = this.getServerpodPath;
        if (!_p) {
            if (existsSync(path)) {
                Serverpod._context?.globalState.update(Constants.extensionServerpodPathKey, path);
            } else {
                throw new Error(`${path} does not exist`);
            }
        }
    }

    /**
     * 
     * Initialize the serverpod extension necessary paths
     * */
    public init(): void {
        const _flutter: Flutter = Flutter.getInstance(Serverpod._context!);

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
                _flutter.setFlutterPath = _p;
            }
            if (_p.endsWith(join('dart-sdk', 'bin')) || _p.endsWith(join('dart-sdk', 'bin', sep))) {
                console.log(_p);
                _flutter.setDartPath = _p;
            }
            if (Constants.isWindows ? _p.includes(join('pub', 'cache')) : _p.includes('.pub-cache')) {
                console.log(_p);
                _flutter.setPubCachePath = _p;
            }
            if (Constants.isWindows ? _p.endsWith('serverpod.bat') : _p.endsWith('serverpod')) {
                console.log(_p);
                this.setServerpodPath = _p;
            }
        });

        /**
         * Set-up serverpod path
         */
        if (!this.getServerpodPath) {
            const _serverpodPath: string = join(_flutter.pubCachePath!, Constants.isWindows ? 'serverod.bat' : 'serverpod');
            if (existsSync(_serverpodPath)) {
                this.setServerpodPath = _flutter.pubCachePath!;
            }
        }
    }
}