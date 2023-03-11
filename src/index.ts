import { readFile } from 'fs/promises';
import { join } from 'path';
import * as vscode from 'vscode';
import { Serverpod } from './base/classes/serverpod.class';
import { Snippet } from './base/classes/snippet';
import { Terraform } from './base/classes/terraform.class';
import { TfPlanner } from './base/classes/tf.plan.class';
import { Constants } from './utils/constants.util';
import { LogCategory } from './utils/enums.util';
import { ExtLogger } from './utils/logger.util';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	var logger: ExtLogger = new ExtLogger(LogCategory.extension);
	try {
		const _serverpod: Serverpod = new Serverpod(context);
		const _terraform: Terraform = new Terraform(context);
		await _serverpod.init();
		// read a file in the current workspace
		var file = await readFile(join('', 'Users', 'ajaylee', 'serverpod_ext', 'src', 'out.json'), 'utf8');
		var a = TfPlanner.extractPlanConfigs(file);
		logger.info('Congratulations, your extension \'serverpod\' is now active!');
		const disposableCreate: vscode.Disposable = vscode.commands.registerCommand(Constants.createCommand, async () => await _serverpod.createServerpodFlutterProject());
		const disposableGenerate: vscode.Disposable = vscode.commands.registerCommand(Constants.generateCommand, async () => await _serverpod.generateServerpodCode());
		const disposableServe: vscode.Disposable = vscode.commands.registerCommand(Constants.serveCommand, async () => await _serverpod.startServerpodServer());
		const disposableStopServe: vscode.Disposable = vscode.commands.registerCommand(Constants.stopServeCommand, async () => await _serverpod.stopServer());
		const disposableDeployAws: vscode.Disposable = vscode.commands.registerCommand(Constants.deployCommand, () => {
			logger.info('Deploying to AWS');
			return _terraform.deployAws();
		});
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
		logger.error(error);
		await vscode.window.showInformationMessage(`${error}`);
		return;
	}
}

export async function deactivate(context: vscode.ExtensionContext): Promise<void> {
	var logger: ExtLogger = new ExtLogger(LogCategory.extension);
	const _serverpod: Serverpod = new Serverpod(context);
	_serverpod.stopServer();
	_serverpod.stopGenerating();
	context.subscriptions.forEach((subscription: vscode.Disposable) => {
		logger.info('Disposing ' + subscription);
		subscription.dispose();
	});
	logger.info('Your extension \'serverpod\' is now deactivated!');
}