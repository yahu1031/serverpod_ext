import path = require('path');
import { commands, Disposable, ExtensionContext, Uri, window } from 'vscode';
import { Serverpod } from './base/classes/serverpod.class';
import { Snippet } from './base/classes/snippet';
import { Constants } from './utils/constants.util';
import { Utils } from './utils/utils.util';

export async function activate(context: ExtensionContext): Promise<void> {
	try {
		const _serverpod: Serverpod = new Serverpod(context);
		await _serverpod.init();

		console.log('Congratulations, your extension \'serverpod\' is now active!');
		var isServerpodProj = context.globalState.get(Constants.isServerpodProj);
		await commands.executeCommand('setContext', 'serverpod.serving', undefined);
		await context.globalState.update('serverpod.serving', undefined);
		if (isServerpodProj) {
			await commands.executeCommand('setContext', 'serverpod.serving', false);
			await context.globalState.update('serverpod.serving', false);
		}
		const disposableCreate: Disposable = commands.registerCommand(Constants.createCommand, async () => await _serverpod.createServerpodFlutterProject());
		const disposableGenerate: Disposable = commands.registerCommand(Constants.generateCommand, async () => await _serverpod.generateServerpodCode());
		const disposableServe: Disposable = commands.registerCommand(Constants.serveCommand, async (_: Uri, launchTemplate: any | undefined) => {
			if (!isServerpodProj) {
				window.showErrorMessage('Not a serverpod project');
				return;
			}
			await commands.executeCommand('setContext', 'serverpod.serving', true);
			await context.globalState.update('serverpod.serving', true);
			var projNameSplitList = new Utils(context).projectPath?.uri.path.split(path.sep);
			if (!projNameSplitList) {
				window.showErrorMessage('Not a serverpod project');
				return;
			}
			const launchConfig = Object.assign(
				{
					name: 'Serverpod server',
					noDebug: false,
					request: "launch",
					cwd: path.join("${workspaceFolder}", projNameSplitList[projNameSplitList.length - 1]),
					type: "dart",
				},
				launchTemplate,
				{
					program: path.join("${workspaceFolder}", projNameSplitList[projNameSplitList.length - 1], "bin", "main.dart"),
				},
			);
			await commands.executeCommand('setContext', 'serverpod.launchConfig', launchConfig);
			await context.globalState.update('serverpod.launchConfig', launchConfig);
			await _serverpod.startServerpodServer();
		});
		const disposableStopServe: Disposable = commands.registerCommand(Constants.stopServeCommand, async () => await _serverpod.stopServer());
		context.subscriptions.push(disposableCreate, disposableGenerate, disposableServe, disposableStopServe, Snippet.disposableSnippet(Constants.dartMode), Snippet.disposableSnippet(Constants.protocolYamlMode));
	} catch (error) {
		console.error(error);
		await window.showInformationMessage(`${error}`);
		return;
	}
}

export async function deactivate(context: ExtensionContext): Promise<void> {
	const _serverpod: Serverpod = new Serverpod(context);
	_serverpod.stopServer();
	_serverpod.stopGenerating();
	console.log('Your extension \'serverpod\' is now deactivated!');
}
