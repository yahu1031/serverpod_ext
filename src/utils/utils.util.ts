import { Uri, window } from 'vscode';

export class Utils {
    static getRandomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static async pickPath(): Promise<string | undefined> {
        const folder: Uri[] | undefined = await window.showOpenDialog({
            canSelectFolders: true,
            defaultUri: Uri.file(process.env['HOME']!),
            openLabel: 'Select a directory',
        });
        return folder?.[0]?.path;
    }
}