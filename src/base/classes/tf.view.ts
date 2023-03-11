
import * as vscode from 'vscode';
import { MyListType, TerraformChange } from './tf.plan.class';

const panel = vscode.window.createWebviewPanel(
    'tableView',
    'Table View',
    vscode.ViewColumn.One,
    {
        enableScripts: true,
        enableCommandUris: true,
        enableFindWidget: true,
        retainContextWhenHidden: true,
    }
);

function compare(beforeVal: any, afterVal: any): any {
    if (Array.isArray(beforeVal) && Array.isArray(afterVal)) {
        if (beforeVal.length !== afterVal.length) {
            return afterVal;
        }
        const newArray: any[] = [];
        for (let i = 0; i < beforeVal.length; i++) {
            if (beforeVal[i] !== afterVal[i]) {
                newArray.push(afterVal[i]);
            }
        }
        return newArray.length > 0 ? newArray : undefined;
    } else if (typeof beforeVal === "object" && typeof afterVal === "object" && beforeVal !== null && afterVal !== null) {
        const newObject: Record<string, any> = {};
        for (const [key, value] of Object.entries(afterVal)) {
            const result = compare(beforeVal[key], value);
            if (result !== undefined) {
                newObject[key] = result;
            }
        }
        return Object.keys(newObject).length > 0 ? newObject : undefined;
    } else if (beforeVal !== afterVal) {
        return afterVal;
    }
}

function getUpdatedValues(before: Record<string, any>, after: Record<string, any>): Record<string, any> {

    const updatedValues: Record<string, any> = {};

    for (const [key, value] of Object.entries(after)) {
        if (before[key] !== undefined) {
            const result = compare(before[key], value);
            if (result !== undefined) {
                updatedValues[key] = result;
            }
        } else {
            updatedValues[key] = value;
        }
    }
    // Remove empty arrays
    for (const [key, value] of Object.entries(updatedValues)) {
        if (Array.isArray(value) && value.length === 0) {
            delete updatedValues[key];
        }
    }
    return updatedValues;
}


function beforeTable(obj: any): String {

    const myMap = new Map(Object.entries(obj));

    var table1 = `<table >`;
    if (myMap.size === 0) {
        table1 += `<tr><td>No Existing Resource</td></tr>`;
    } else {
        myMap.forEach((val, key) => {
            table1 += `<tr border-bottom: 1pt solid white;><td >${key}</td><td
            data-row='${JSON.stringify(
                val
            )}' onclick="expandCell(this)" >Click To Expand</td></tr>`;
        });
    }

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
            <th>Changes</th>
            `;

            val.forEach((item) => {
                table1 += `
            <tr>
                <td style="border: 1px solid gray; padding: 8px; text-align: left;"> ${item.name} </td>
                <td style="border: 1px solid gray; padding: 8px; text-align: left;"> ${item.address} </td>
                <td style="border: 1px solid gray; padding: 8px; text-align: left;"> ${item.action} </td>
                <td style="border: 1px solid gray; padding: 8px; text-align: left;"> ${beforeTable(getUpdatedValues(item.before, item.after))} </td>
            </tr>
            <tr><td></td></tr>
            <tr><td></td></tr>
            <tr><td></td></tr>
            `;
            });
        });

        var table = table1 += `</table>`;
        panel.webview.html = ` 
        
    <style>
      table {
        border-collapse: collapse;
        width: 100%;
      }

      th, td {
        padding: 8px;
        text-align: left;
      }

      tr.expanded td {
        height: auto !important;
      }
    </style>

        
        
        
   ${table}



    <script>
      function expandCell(cell) {
        let mapObj = JSON.parse(cell.dataset.row);
        
        let stringObj = JSON.stringify(mapObj);


        if(cell.innerText === "Click To Expand"){
            cell.innerText = stringObj; 
        }else{
            cell.innerText = "Click To Expand";
        }

        let row = cell.parentNode;
        let isExpanded = row.classList.contains('expanded');
        row.classList.toggle('expanded');
        row.style.height = isExpanded ? '' : (row.offsetHeight * 2) + 'px';
      }
    </script>
        
        `;

    };
}



export function activate(context: vscode.ExtensionContext) {
    const command = vscode.commands.registerCommand('extension.openTableView', () => {
        panel.reveal();
    });

    context.subscriptions.push(command);
}
