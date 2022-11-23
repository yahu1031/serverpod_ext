import { commands, Disposable, ExtensionContext, window } from 'vscode';
import { Serverpod } from './base/classes/serverpod.class';
import { Constants } from './utils/constants.util';

export async function activate(context: ExtensionContext): Promise<void> {
	try {
		const _serverpod: Serverpod = new Serverpod(context);
		await _serverpod.init();

		console.log('Congratulations, your extension \'serverpod\' is now active!');

		const disposable: Disposable = commands.registerCommand('serverpod.serverpod', async () => {
			const option = await window.showQuickPick(Constants.quickPicks, { matchOnDetail: true });
			if (option === Constants.quickPicks[0]) {
				await _serverpod.createServerpodFlutterProject();
			}
			if (option === Constants.quickPicks[1]) {
				await _serverpod.generateServerpodCode();
			}
		});
		context.subscriptions.push(disposable);
	} catch (error) {
		console.error(error);
		await window.showInformationMessage(`${error}`);
		return;
	}
}

export function deactivate() { }
