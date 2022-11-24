import { commands, Disposable, ExtensionContext, window } from 'vscode';
import { Serverpod } from './base/classes/serverpod.class';
import { Constants } from './utils/constants.util';

export async function activate(context: ExtensionContext): Promise<void> {
	try {
		const _serverpod: Serverpod = new Serverpod(context);
		await _serverpod.init();

		console.log('Congratulations, your extension \'serverpod\' is now active!');
		const disposableCreate: Disposable = commands.registerCommand(Constants.createCommand, async () => await _serverpod.createServerpodFlutterProject());
		const disposableGenerate: Disposable = commands.registerCommand(Constants.generateCommand, async () => await _serverpod.generateServerpodCode());
		context.subscriptions.push(disposableCreate, disposableGenerate);
	} catch (error) {
		console.error(error);
		await window.showInformationMessage(`${error}`);
		return;
	}
}

export function deactivate() { }
