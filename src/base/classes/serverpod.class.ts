import { existsSync } from 'fs';
import { delimiter, join, sep } from 'path';
import { ExtensionContext, window } from 'vscode';
import { Constants } from '../../utils/constants.util';
import { Flutter } from './flutter.class';
import { ServerpodInterface } from './../interfaces/serverpod.interface';
import { Utils } from './../../utils/utils.util';

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
     * @override
     * @param name 
     * @param path 
     */
    public async createFlutterProject(name: string, path: string): Promise<void> {
        const _path = await Utils.pickPath();
        console.log(_path);
        if (!_path) {
            await window.showErrorMessage('No path selected');
            return;
        }
    }

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