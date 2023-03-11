
import * as vscode from 'vscode';
import { MyListType, TerraformChange } from './tf.plan.class';

const panel = vscode.window.createWebviewPanel(
    'tableView',
    'Table View',
    vscode.ViewColumn.One,
    {}
);


function beforeTable(obj: any): String {

    const myMap = new Map(Object.entries(obj));
    console.log(myMap);

    var table1 = `<table>`;



    myMap.forEach((val, key) => {
        table1 += `<tr><td>${key}</td><td>${val}</td></tr>`;
    });

    var table = table1 += `</table`;
    return table;
}

function createHeader(header: String) {
    return `
    <tr>
        <td>${header}</td>
    </tr>
    `;
}



export class TfViewer {



    public static showView = (rawData: Map<string, MyListType>) => {

        var table1 = `<table style="border-collapse: collapse; border: 2px solid black; width: 100%;">`;

        rawData.forEach((val, key) => {
            table1 += `
            <tr style="border: 1px solid gray; padding: 8px; text-align: left; background-color: lightgray; color: black;">
                <td> ${key} </td>
            </tr>
            <tr><td></td></tr>
            <tr><td></td></tr>
            <tr><td></td></tr>
            `;

            table1 += `
            <th>Name</th>
            <th>Address</th>
            <th>Action</th>
            <th>Before</th>
            <th>After</th>
            `;

            val.forEach((item) => {
                table1 += `
            <tr>
                <td style="border: 1px solid gray; padding: 8px; text-align: left;"> ${item.name} </td>
                <td style="border: 1px solid gray; padding: 8px; text-align: left;"> ${item.address} </td>
                <td style="border: 1px solid gray; padding: 8px; text-align: left;"> ${item.action} </td>
                <td style="border: 1px solid gray; padding: 8px; text-align: left;"> ${beforeTable(item.before)} </td>
                <td style="border: 1px solid gray; padding: 8px; text-align: left;"> ${beforeTable(item.after)} </td>
            </tr>
            <tr><td></td></tr>
            <tr><td></td></tr>
            <tr><td></td></tr>
            `;
            });
        });

        var table = table1 += `</table>`;
        panel.webview.html = table;

    };
}



export function activate(context: vscode.ExtensionContext) {
    const command = vscode.commands.registerCommand('extension.openTableView', () => {
        panel.reveal();
    });

    context.subscriptions.push(command);
}
