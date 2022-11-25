import { commands, Disposable, ExtensionContext, window } from 'vscode';
import { Serverpod } from './base/classes/serverpod.class';
import { Constants } from './utils/constants.util';

export async function activate(context: ExtensionContext): Promise<void> {
	try {
		const _serverpod: Serverpod = new Serverpod(context);
		await _serverpod.init();

		console.log('Congratulations, your extension \'serverpod\' is now active!');
		var isServerpodProj = await _serverpod.isServerpodProject();
		await commands.executeCommand('setContext', 'serverpod.serving', undefined);
		await context.globalState.update('serverpod.serving', undefined);
		if(isServerpodProj) {
			await commands.executeCommand('setContext', 'serverpod.serving', false);
			await context.globalState.update('serverpod.serving', false);
		} 
		const disposableCreate: Disposable = commands.registerCommand(Constants.createCommand, async () => await _serverpod.createServerpodFlutterProject());
		const disposableGenerate: Disposable = commands.registerCommand(Constants.generateCommand, async () => await _serverpod.generateServerpodCode());
		const disposableServe: Disposable = commands.registerCommand(Constants.serveCommand, async () => await _serverpod.startServerpodServer());
		const disposableStopServe: Disposable = commands.registerCommand(Constants.stopServeCommand, async () => await _serverpod.stopServer());
		context.subscriptions.push(disposableCreate, disposableGenerate, disposableServe, disposableStopServe);
	} catch (error) {
		console.error(error);
		await window.showInformationMessage(`${error}`);
		return;
	}
}

export async function deactivate(context: ExtensionContext): Promise<void> { 
	console.log('Your extension \'serverpod\' is now deactivated!');
	// context.subscriptions.forEach((disposable) => disposable.dispose());
	// const _serverpod: Serverpod = new Serverpod(context);
}
