import * as vscode from 'vscode';
import { Serverpod } from './base/classes/serverpod.class';
import { Snippet } from './base/classes/snippet';
import { Constants } from './utils/constants.util';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	try {
		const _serverpod: Serverpod = new Serverpod(context);
		await _serverpod.init();
		console.log('Congratulations, your extension \'serverpod\' is now active!');
		const disposableCreate: vscode.Disposable = vscode.commands.registerCommand(Constants.createCommand, _serverpod.createServerpodFlutterProject);
		const disposableGenerate: vscode.Disposable = vscode.commands.registerCommand(Constants.generateCommand, _serverpod.generateServerpodCode);
		const disposableServe: vscode.Disposable = vscode.commands.registerCommand(Constants.serveCommand, _serverpod.startServerpodServer);
		const disposableStopServe: vscode.Disposable = vscode.commands.registerCommand(Constants.stopServeCommand, _serverpod.stopServer);
		context.subscriptions.push(
			disposableCreate,
			disposableGenerate,
			disposableServe,
			disposableStopServe,
			Snippet.disposableSnippet(Constants.dartMode),
			Snippet.disposableSnippet(Constants.protocolYamlMode),
		);
	} catch (error) {
		console.error(error);
		await vscode.window.showInformationMessage(`${error}`);
		return;
	}
}

export async function deactivate(context: vscode.ExtensionContext): Promise<void> {
	const _serverpod: Serverpod = new Serverpod(context);
	_serverpod.stopServer();
	_serverpod.stopGenerating();
	context.subscriptions.forEach((subscription: vscode.Disposable) => {
		console.log('Disposing ' + subscription);
	});
	console.log('Your extension \'serverpod\' is now deactivated!');
}