import { delimiter } from 'path';
import { QuickPickItem } from 'vscode';

/**
 * Extension constants
 */
export class Constants {
    static readonly extensionName: string = 'serverpod';

    static readonly extensionFlutterPathKey: string = `${this.extensionName}.flutterPath`;
    
    static readonly extensionDartPathKey: string = `${this.extensionName}.dartPath`;

    static readonly extensionPubCachePathKey: string = `${this.extensionName}.pubCachePath`;

    static readonly extensionServerpodPathKey: string = `${this.extensionName}.serverpodPath`;

    static readonly isWindows: boolean = process.platform === 'win32';

    static readonly isMac: boolean = process.platform === 'darwin';

    static readonly isLinux: boolean = process.platform === 'linux';

    static readonly envPaths: string[] | undefined = process.env.PATH?.toLowerCase().split(delimiter);

    static readonly quickPicks: QuickPickItem[] = [{
        title: 'Create',
        description: 'Create a new serverpod project',
    },
    {
        title: 'Generate',
        description: 'Generate the necessary files for the serverpod project',
    }
    ].map(_cmd => {
        return {
            label: _cmd.title,
            detail: _cmd.description,

        };
    });

    static readonly projectNameRegex: RegExp = new RegExp("^[a-z][a-z0-9_]*$");
}