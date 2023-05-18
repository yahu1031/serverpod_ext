import * as vscode from 'vscode';
import { Serverpod } from './base/classes/serverpod.class';
import { Snippet } from './base/classes/snippet';
import { Constants } from './utils/constants.util';
import { LogCategory } from './utils/enums.util';
import { ExtLogger } from './utils/logger.util';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	const logger: ExtLogger = new ExtLogger(LogCategory.extension);
	try {
		const _serverpod: Serverpod = new Serverpod(context);
		await _serverpod.init();
		logger.info('activate', '🎉 Congratulations, your extension \'serverpod\' is now active!');
		const disposableCreate: vscode.Disposable = vscode.commands.registerCommand(Constants.createCommand, async () => await _serverpod.createServerpodFlutterProject());
		const disposableGenerate: vscode.Disposable = vscode.commands.registerCommand(Constants.generateCommand, async () => await _serverpod.generateServerpodCode());
		const disposableServe: vscode.Disposable = vscode.commands.registerCommand(Constants.serveCommand, async () => await _serverpod.startServerpodServer());
		const disposableStopServe: vscode.Disposable = vscode.commands.registerCommand(Constants.stopServeCommand, async () => await _serverpod.stopServer());
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
	const logger: ExtLogger = new ExtLogger(LogCategory.extension);
	_serverpod.stopServer();
	_serverpod.stopGenerating();
	context.subscriptions.forEach((subscription: vscode.Disposable) => {
		logger.info('deactivate', '🗑️ Disposing ' + subscription);
	});
	logger.info('deactivate', '💀 Your extension \'serverpod\' is now deactivated!');
}