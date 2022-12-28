import { delimiter } from 'path';
import * as vscode from 'vscode';

/**
 * Extension constants
 */
export class Constants {

    static readonly isWindows: boolean = process.platform === 'win32';

    static readonly isMac: boolean = process.platform === 'darwin';

    static readonly isLinux: boolean = process.platform === 'linux';

    static readonly serverpodApp: string = this.isWindows ? 'serverpod.bat' : 'serverpod';

    static readonly extensionName: string = 'serverpod';

    static readonly isServerpodProj: string = `${this.extensionName}.isServerpodProj`;

    static readonly extensionFlutterPathKey: string = `${this.extensionName}.flutterPath`;

    static readonly extensionDartPathKey: string = `${this.extensionName}.dartPath`;

    static readonly extensionPubCachePathKey: string = `${this.extensionName}.pubCachePath`;

    static readonly extensionServerpodPathKey: string = `${this.extensionName}.serverpodPath`;

    static readonly extensionServerPath: string = `${this.extensionName}.serverPath`;

    static readonly createCommand: string = `${this.extensionName}.create`;

    static readonly generateCommand: string = `${this.extensionName}.generate`;
    
    static readonly serveCommand: string = `${this.extensionName}.serve`;
    
    static readonly stopServeCommand: string = `${this.extensionName}.stopServe`;

    static readonly envPaths: string[] | undefined = process.env.PATH?.toLowerCase().split(delimiter);

    static readonly channel: vscode.OutputChannel = vscode.window.createOutputChannel("Serverpod");

    static readonly quickPicks: vscode.QuickPickItem[] = [{
        title: 'Create',
        description: 'Create a new serverpod project',
    },
    {
        title: 'Generate',
        description: 'Generate the necessary files for the serverpod project',
    },
    {
        title: 'Deploy',
        description: 'Deploy the serverpod project to the server',
    }
    ].map(_cmd => {
        return {
            label: _cmd.title,
            detail: _cmd.description,

        };
    });

    static readonly genQuickPicks: vscode.QuickPickItem[] = [{
        title: 'Once (Recommended)',
        description: 'Generate the necessary files for the serverpod project once',
    },
    {
        title: 'Watch',
        description: 'Watch the serverpod project and generate the necessary files when changes are made',
    }
    ].map(_ => {
        return {
            label: _.title,
            detail: _.description,

        };
    });

    static readonly projectNameRegex: RegExp = new RegExp("^[0-9a-z]+(?:[0-9a-z]+|_[0-9a-z]+)*$");

    static readonly dartMode: vscode.DocumentFilter & { language: string } = { language: "dart", scheme: "file" };

    static readonly protocolYamlMode : vscode.DocumentFilter & { language: string } = { language: "yaml", pattern: "**/protocol/*.yaml", scheme: "file" };
}