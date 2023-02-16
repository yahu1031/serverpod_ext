import { existsSync, readFileSync } from 'fs';
import { readdir } from 'fs/promises';
import { get } from 'https';
import { arch, platform } from 'os';
import { join } from 'path';
import * as vscode from 'vscode';
import { LogCategory } from '../../utils/enums.util';
import { ExtLogger } from '../../utils/logger.util';
import { Utils } from '../../utils/utils.util';
import which = require('which');

export class Terraform {

    /**
     * Private ExtensionContext
     */
    private context?: vscode.ExtensionContext;

    /**
     * Constructor for the Terraform class
     */
    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this._utils = new Utils(context);
    }


    /**
     * {@link Utils} class private instance
     * */
    private _utils: Utils;

    private logger: ExtLogger = new ExtLogger(LogCategory.terraform);


    private downloadLink: string = '';

    private get getDownloadLink(): string {
        var deviceArch = arch();
        var deviceOs = platform() === 'win32' ? 'windows' : platform();
        // if (deviceOs === 'darwin') {
        //     return 'https://developer.hashicorp.com/terraform/downloads';
        // }
        // make an fetch api call to get the download link
        get('https://api.releases.hashicorp.com/v1/releases/terraform/latest', (res) => {
            var data = '';
            res.on('data', (chunk) => {
                data += chunk;
                this.logger.info(data);
            });
            res.on('end', () => {
                var jsonData = JSON.parse(data);
                var builds = jsonData.builds;
                this.logger.info(builds);
                // find the download link for the current device from the builds array
                for (var build of builds) {
                    if (build.os === deviceOs && build.arch === deviceArch) {
                        this.downloadLink = build.url;
                        return;
                    }
                }
                this.waitForDownloadLink();
                return this.downloadLink;
            });
        });
        this.waitForDownloadLink();
        return this.downloadLink;
    }


    private waitForDownloadLink() {
        while (this.downloadLink === '') {
            this.logger.info('Waiting for download link');
            setTimeout(() => { }, 10);
        }
    }

    /**
     * Deploy server to AWS
     * */
    public async deployAws(): Promise<void> {
        var terraformFound = await which('terraform');
        terraformFound ? await this.initConfig() : await this.setupTerraform();
    }

    private async setupTerraform(): Promise<void> {
        var errToast = await vscode.window.showErrorMessage('Terraform not found. Do you want to install it?', 'Yes', 'No');
        if (errToast === 'Yes') {
            this.getDownloadLink;
            this.waitForDownloadLink();
            this.logger.info(this.downloadLink);
            await Utils.openInBrowser(this.downloadLink);
            await vscode.commands.executeCommand('workbench.action.closePanel');
        } else {
            await vscode.commands.executeCommand('workbench.action.closePanel');
            await vscode.window.showErrorMessage('Terraform is required to deploy to AWS', 'Ok').then(() => {
                vscode.commands.executeCommand('workbench.action.closePanel');
            });
        }
    }

    private async initConfig() {
        var configFile = join(this._utils.serverPath!, 'aws', 'terraform', 'config.auto.tfvars');
        if (!existsSync(configFile)) {
            configFile = (await this.getTerraformVarsPath())!;
        }
        var tfVars = this.readTerraformVars(configFile);
        var tempVars = tfVars;
        var zoneId = await vscode.window.showInputBox({
            title: 'Enter the hosted zone ID',
            placeHolder: 'e.g Z2FDTNDATAQYW2',
            ignoreFocusOut: true,
        });
        var domain = await vscode.window.showInputBox({
            title: 'Enter the domain name',
            placeHolder: 'e.g. example.com',
            ignoreFocusOut: true,
        });
        var certArnUsWest = await vscode.window.showInputBox({
            title: 'Enter the certificate ARN',
            placeHolder: 'us-west-2',
            ignoreFocusOut: true,
        });
        var certArnUsEast = await vscode.window.showInputBox({
            title: 'Enter the certificate ARN',
            placeHolder: 'us-east-1',
            ignoreFocusOut: true,
        });
        for (var key in tempVars) {
            if (tempVars[key].name.startsWith('hosted_zone_id ')) {
                tempVars[key].value = `"${zoneId}"` ?? '';
            }
            if (tempVars[key].name.startsWith('top_domain ')) {
                tempVars[key].value = `"${domain}"` ?? '';
            }
            if (tempVars[key].name.startsWith('certificate_arn ')) {
                tempVars[key].value = `"${certArnUsWest}"` ?? '';
            }
            if (tempVars[key].name.startsWith('cloudfront_certificate_arn ')) {
                tempVars[key].value = `"${certArnUsEast}"` ?? '';
            }
        }
        await Utils.writeTerraformVars(configFile, tempVars);
        // await this.terraformInit();
        await this.terraformPlan();
    }

    /**
     * Terraform initialization
     * */
    public async terraformInit(): Promise<any> {
        const dotTerrafomPath = join(this._utils.serverPath!, 'aws', 'terraform', '.terraform');
        if (existsSync(dotTerrafomPath)) {
            return await vscode.window.showInformationMessage('Skipping terraform initialization...');
        }
        return await Utils.runSpawnAsync('terraform', ['init']).then((code) => {
            return code === 0 ? vscode.window.showInformationMessage('Terraform initialized successfully')
                : vscode.window.showErrorMessage('Terraform initialization failed');
        });
    }

    public async terraformPlan(): Promise<any> {
        // vscode.window.createWebviewPanel('Terraform Plan', 'Terraform Plan', vscode.ViewColumn.One, {
        //     enableScripts: true,
        //     retainContextWhenHidden: true,
        // });
        const dbPassword = await vscode.window.showInputBox({
            title: 'Enter the database password',
            placeHolder: 'e.g. password',
            ignoreFocusOut: true,
        });
        var planDirectory = join(this._utils.serverPath!, 'aws', 'terraform');
        // eslint-disable-next-line @typescript-eslint/naming-convention
        // Utils.runExecAsync('terraform plan', planDirectory, { 'DB_PASSWORD': dbPassword })
        //     .then(planOutput => {
        //         const [existingConfigs, changedConfigs] = Utils.extractPlanConfigs(planOutput);

        //         console.log("Existing Configs: ", existingConfigs);
        //         console.log("Changed Configs: ", changedConfigs);
        //     })
        //     .catch(error => {
        //         console.error(`Error executing Terraform plan: ${error}`);
        //     });

    }

    /**
     * Read `.tfvars` file and return the parsed data
     * @param {string} path
     * @returns {any[]} parsed data
     * */
    public readTerraformVars(path: string): { name: string, value: string }[] {
        const tfvarsLines = readFileSync(path, 'utf-8');
        return Utils.tfParser(tfvarsLines);
    }


    /**
     * Get terraform variables file path
     * @returns {Promise<string | undefined>} path to the file
     * */
    public async getTerraformVarsPath(): Promise<string | undefined> {
        let files: string[] = [];
        const getDirectories = async (source: string): Promise<string[]> =>
            (await readdir(source, { withFileTypes: true }))
                .filter(dirent => dirent.isFile() && !dirent.name.startsWith('.'))
                .map(dirent => dirent.name);
        files = await getDirectories(join(this._utils.serverPath!, 'aws', 'terraform'));
        if (files.length === 0) {
            return await vscode.window.showErrorMessage('No terraform config files found');
        }
        var file = await vscode.window.showQuickPick(files, {
            matchOnDetail: true,
            ignoreFocusOut: true,
            placeHolder: 'Select the terraform config file',
            canPickMany: false,
            title: 'Select the terraform config file',
        });
        if (file === undefined) {
            return await vscode.window.showErrorMessage('No terraform config file selected');
        }
        return join(this._utils.serverPath!, 'aws', 'terraform', file);
    }
}