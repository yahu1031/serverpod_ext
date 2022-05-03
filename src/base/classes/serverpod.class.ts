import { existsSync } from 'fs';
import { join, sep } from 'path';
import { commands, ExtensionContext, OutputChannel, ProgressLocation, Uri, window } from 'vscode';
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
    public async createServerpodFlutterProject(): Promise<void> {
        const _path = await Utils.pickPath();
        console.log(_path);
        if (!_path) {
            await window.showErrorMessage('No path selected');
            return;
        }
        const _name = await window.showInputBox({ placeHolder: 'dummy', value: 'dummy', ignoreFocusOut: true, title: 'Enter a name for your project', validateInput: (s) => Utils.validateProjectName(s, _path) });
        if (!_name) {
            await window.showErrorMessage('No name entered');
            return;
        }
        else {
            const _channel: OutputChannel = window.createOutputChannel("Serverpod");
            _channel.show();
            await window.withProgress({
                title: "Serverpod",
                location: ProgressLocation.Notification,
                cancellable: false,
            }, async (progress, _token) => {
                progress.report({ message: 'Creating project...' });
                const p = await new Promise<void>((resolve, reject) => {
                    const a = spawn(Constants.serverpodApp, ['create', _name], { cwd: _path });
                    a.stdout.on('data', async (data) => {
                        console.log(data.toString());
                        _channel.append(data.toString());
                    });
                    a.stdout.on('close', async () => {
                        console.log('serverpod project created');
                        resolve();
                    });
                    a.stdout.on('error', async (err) => {
                        console.error(err);
                        _channel.append(err.toString());
                        reject();
                    });
                });
                return p;
            }).then(async () => {
                console.log('Done');
                _channel.appendLine('Project created successfully');
                console.log(join(_path, _name));
                await commands.executeCommand("vscode.openFolder", join(_path, _name));
                window.showInformationMessage('Serverpod project created successfully');
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