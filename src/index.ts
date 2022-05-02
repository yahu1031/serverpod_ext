import * as vscode from 'vscode';
import { Serverpod } from './base/classes/serverpod.class';
import { Constants } from './utils/constants.util';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	try {
		const _serverpod: Serverpod = Serverpod.getInstance(context);
		_serverpod.init();

		console.log('Congratulations, your extension \'serverpod\' is now active!');

		const disposable: vscode.Disposable = vscode.commands.registerCommand('serverpod.create', async () => {
			const option = await vscode.window.showQuickPick(Constants.quickPicks, { matchOnDetail: true });
			if (option === Constants.quickPicks[0]) {
				await _serverpod.createFlutterProject('', '');
			}
		});

		context.subscriptions.push(disposable);
	} catch (error) {
		console.error(error);
		await vscode.window.showInformationMessage(`${error}`);
		return;
	}
}

export function deactivate() { }
