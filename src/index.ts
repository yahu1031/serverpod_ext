import * as vscode from 'vscode';
import { Serverpod } from './base/classes/serverpod.class';
import { Snippet } from './base/classes/snippet';
import { Terraform } from './base/classes/terraform.class';
import { Constants } from './utils/constants.util';
import { arch } from 'os';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	try {
		const _serverpod: Serverpod = new Serverpod(context);
		const _terraform: Terraform = new Terraform(context);
		await _serverpod.init();
		console.log('Congratulations, your extension \'serverpod\' is now active!');
		const disposableCreate: vscode.Disposable = vscode.commands.registerCommand(Constants.createCommand, async () => await _serverpod.createServerpodFlutterProject());
		const disposableGenerate: vscode.Disposable = vscode.commands.registerCommand(Constants.generateCommand, async () => await _serverpod.generateServerpodCode());
		const disposableServe: vscode.Disposable = vscode.commands.registerCommand(Constants.serveCommand, async () => await _serverpod.startServerpodServer());
		const disposableStopServe: vscode.Disposable = vscode.commands.registerCommand(Constants.stopServeCommand, async () => await _serverpod.stopServer());
		const disposableDeployAws: vscode.Disposable = vscode.commands.registerCommand(Constants.deployCommand, () => _terraform.deployAws());
		context.subscriptions.push(
			disposableCreate,
			disposableGenerate,
			disposableServe,
			disposableStopServe,
			disposableDeployAws,
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
		subscription.dispose();
	});
	console.log('Your extension \'serverpod\' is now deactivated!');
}