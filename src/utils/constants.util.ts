import { delimiter } from 'path';
import { OutputChannel, QuickPickItem, window } from 'vscode';

/**
 * Extension constants
 */
export class Constants {

    static readonly isWindows: boolean = process.platform === 'win32';

    static readonly isMac: boolean = process.platform === 'darwin';

    static readonly isLinux: boolean = process.platform === 'linux';

    static readonly serverpodApp: string = this.isWindows ? 'serverpod.bat' : 'serverpod';

    static readonly extensionName: string = 'serverpod';

    static readonly extensionFlutterPathKey: string = `${this.extensionName}.flutterPath`;

    static readonly extensionDartPathKey: string = `${this.extensionName}.dartPath`;

    static readonly extensionPubCachePathKey: string = `${this.extensionName}.pubCachePath`;

    static readonly extensionServerpodPathKey: string = `${this.extensionName}.serverpodPath`;

    static readonly extensionServerPath: string = `${this.extensionName}.serverPath`;

    static readonly createCommand: string = `${this.extensionName}.create`;

    static readonly generateCommand: string = `${this.extensionName}.generate`;
    
    static readonly serverCommand: string = `${this.extensionName}.server`;

    static readonly envPaths: string[] | undefined = process.env.PATH?.toLowerCase().split(delimiter);

    static readonly channel: OutputChannel = window.createOutputChannel("Serverpod");

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

    static readonly genQuickPicks: QuickPickItem[] = [{
        title: 'Once (Recommended)',
        description: 'Generate the necessary files for the serverpod project once',
    },
    {
        title: 'Watch (BETA - EXPERIMENTAL)',
        description: 'Watch the serverpod project and generate the necessary files when changes are made (BETA - EXPERIMENTAL)',
    }
    ].map(_ => {
        return {
            label: _.title,
            detail: _.description,

        };
    });

    static readonly projectNameRegex: RegExp = new RegExp("^[a-z][a-z0-9_]*$");
}