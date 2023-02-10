import axios from 'axios';
import { ChildProcessWithoutNullStreams, exec, spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { readdir, writeFile } from 'fs/promises';
import { get } from 'https';
import { arch, platform, tmpdir } from 'os';
import { join } from 'path';
import * as vscode from 'vscode';
import { Utils } from '../../utils/utils.util';


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
                console.log(data);
            });
            res.on('end', () => {
                var jsonData = JSON.parse(data);
                var builds = jsonData.builds;
                console.log(builds);
                // find the download link for the current device from the builds array
                for (var build of builds) {
                    if (build.os === deviceOs && build.arch === deviceArch) {
                        this.downloadLink = build.url;
                        return;
                    }
                }
                return this.downloadLink;
            });
        });
        return this.downloadLink;
    }


    /**
     * Deploy server to AWS
     * */
    public deployAws(): void {
        spawn('which', ['terraform'], { detached: false }).on('exit', async (code) => {
            if (code === 0) {
                await this.initConfig();
            } else {
                await this.setupTerraform();
            }
        });
    }

    private async setupTerraform() {
        var errToast = await vscode.window.showErrorMessage('Terraform not found. Do you want to install it?', 'Yes', 'No');
        if (errToast === 'Yes') {
            await vscode.commands.executeCommand('workbench.action.closePanel');
            // show progress bar
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Downloading Terraform',
                cancellable: false
            }, async (_, __) => {
                await this.downloadTerraform();
            }).then(async () => {
                await vscode.commands.executeCommand('workbench.action.closePanel');
                await vscode.window.showInformationMessage('Terraform downloaded successfully');
                var terraformPath = join(tmpdir(), 'terraform', 'terraform');
                await vscode.commands.executeCommand('workbench.action.closePanel');
                if (platform() !== 'win32') {
                    var password = await vscode.window.showInputBox({
                        title: 'Enter your password',
                        prompt: 'This is required to move Terraform to /usr/local/bin',
                        password: true,
                        ignoreFocusOut: true,
                    });
                    var terraformInstallExec = new vscode.ShellExecution(`echo ${password} | sudo -S mv ${terraformPath} /usr/local/bin/`);
                    var envRefreshExec = new vscode.ShellExecution('source ~/.bash_profile ~/.bashrc ~/.zshrc');
                    await vscode.window.withProgress({
                        location: vscode.ProgressLocation.Notification,
                        title: 'Installing Terraform',
                        cancellable: false
                    }, async (_, __) => {
                        await vscode.tasks.executeTask(new vscode.Task({ type: 'shell' }, 'Installing Terraform', 'shell', terraformInstallExec));
                        await vscode.commands.executeCommand('workbench.action.closePanel');
                        await vscode.window.showInformationMessage('Terraform installed successfully');
                        await vscode.commands.executeCommand('workbench.action.closePanel');
                        await vscode.window.showInformationMessage('Refreshing environment variables');
                        await vscode.commands.executeCommand('workbench.action.closePanel');
                        await vscode.tasks.executeTask(new vscode.Task({ type: 'shell' }, 'Refreshing Environment Variables', 'shell', envRefreshExec));
                        await vscode.window.showInformationMessage('Environment variables refreshed');
                        await vscode.commands.executeCommand('workbench.action.closePanel');
                        await vscode.window.showInformationMessage('Terraform installed successfully');
                    });
                } else {
                    // command in windows is move terraform.exe C:\Program Files\Terraform
                    exec(`move ${terraformPath} C:\\Program Files\\Terraform`, (err, _, stderr) => {
                        if (err || stderr) {
                            return vscode.window.showErrorMessage('Error Installing Terraform');
                        } else {
                            return vscode.window.showInformationMessage('Terraform Installed Successfully');
                        }
                    });
                    new vscode.ShellExecution('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-File', 'C:\\Program Files\\Terraform\\terraform.exe']);
                }
            });
        } else {
            await vscode.window.showErrorMessage('Terraform is required to deploy to AWS');
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
            prompt: 'e.g Z2FDTNDATAQYW2',
            ignoreFocusOut: true,
        });
        var domain = await vscode.window.showInputBox({
            title: 'Enter the domain name',
            prompt: 'e.g. example.com',
            ignoreFocusOut: true,
        });
        var certArnUsWest = await vscode.window.showInputBox({
            title: 'Enter the certificate ARN',
            prompt: 'us-west-2',
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
        this.writeTerraformVars(configFile, tempVars);
        this.terraformInit();
    }

    public async downloadTerraform(): Promise<void> {
        this.getDownloadLink;
        while (this.downloadLink === '') {
            await new Promise((resolve) => setTimeout(resolve, 10));
        }
        var link = this.downloadLink;
        if (link) {
            // download terraform to temp folder
            const tempDir = tmpdir();
            const terraformPath = join(tempDir, 'terraform');
            const fileName = link.split('/')[link.split('/').length - 1];
            const terraformZip = join(tempDir, fileName);
            console.log(link);
            await axios({
                method: 'get',
                url: link,
                responseType: 'arraybuffer'
            })
                .then(async response => {
                    console.log('Writing terraform to temp folder - ' + terraformZip);
                    await writeFile(terraformZip, new Uint8Array(response.data));
                    console.log('Downloaded terraform');
                })
                .catch(error => {
                    console.error(error);
                });
            console.log('Extracting terraform');
            Utils.extractFileFromZip(terraformZip, terraformPath);
            console.log('Extracting terraform done');
            return Promise.resolve();
        }
    }

    /**
     * Terraform initialization
     * */
    public async terraformInit(): Promise<ChildProcessWithoutNullStreams> {
        return await Promise.resolve(spawn('terraform', ['init'], { detached: false }).on('exit', async (code) => {
            return code === 0 ? await vscode.window.showInformationMessage('Terraform initialized successfully')
                : await vscode.window.showErrorMessage('Terraform initialization failed');
        }));
    }

    public async terraformPlan(): Promise<ChildProcessWithoutNullStreams> {
        return await Promise.resolve(spawn('terraform', ['plan'], { detached: false })
            .on('exit', async (code) => {
                // show an editor with the output of the spawned process
                // vscode.workspace.openTextDocument(join(this._utils.serverPath!, 'aws', 'terraform', 'terraform.tfplan')).then((doc) => {
                //     vscode.window.showTextDocument(doc);
                // });
                return code === 0 ? await vscode.window.showInformationMessage('Terraform plan executed successfully')
                    : await vscode.window.showErrorMessage('Terraform plan execution failed');
            }));
    }

    /**
     * Read `.tfvars` file and return the parsed data
     * @param {string} path
     * @returns {any[]} parsed data
     * */
    public readTerraformVars(path: string): { name: string, value: string }[] {
        const tfvarsLines = readFileSync(path, 'utf-8');
        return this.tfParser(tfvarsLines);
    }

    /**
     * `.tfvar` parser
     * @param {string} data
     * @returns {any[]} parsed data
     * */
    public tfParser(data: string): { name: string, value: any }[] {
        const tfvars = data.split('\n');
        const tfvarsParsed: { name: string, value: any }[] = [];
        tfvars.forEach(line => {
            const [name, valueString] = line.startsWith('#') || line.length === 0 ? [line, ''] : line.split('=') as any[];
            let value;
            if (valueString === 'true' || valueString === 'false' || valueString === '"true"' || valueString === '"false"') {
                value = valueString === 'true' || valueString === '"true"';
            } else if (!isNaN(valueString) && valueString !== '') {
                value = parseFloat(valueString);
            } else {
                value = valueString;
            }
            tfvarsParsed.push({ name, value });
        });
        return tfvarsParsed;
    }

    /**
     * Write terraform variables to the file
     * @param {string} path
     * @param {any[]} configs
     * @returns {Promise<boolean>} true if successful
     * */
    public async writeTerraformVars(path: string, configs: { name: string, value: string }[]): Promise<boolean> {
        let tfvars = '';
        configs.forEach(config => {
            tfvars += config.name.length === 0 ? '\n' : config.name.startsWith('#') ? `${config.name}\n` : `${config.name} = ${config.value.trim()}\n`;
        });
        try {
            await writeFile(path, tfvars, 'utf-8');
            return Promise.resolve(true);
        } catch (e) {
            console.error(e);
            return Promise.reject(false);
        }
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