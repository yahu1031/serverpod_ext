
import * as vscode from 'vscode';

import { MyListType } from './tf.plan.class';

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
            table1 += `<tr border-bottom: 1pt solid white;><td >${key}</td><td id=${key}
            data-row='${JSON.stringify(
                val
            )}' onclick="expandCell(this)" >Click To Expand</td></tr>`;
        });
    }

    var table = table1 += `</table`;
    return table;
}

export class TfViewer {



    public static showView = (rawData: Map<string, MyListType>) => {

        var table1 = `<table style="border-collapse: collapse; border: 2px solid black; width: 100%;">`;

        rawData.forEach((val, key) => {
            table1 += `
            <tr style="border: 1px solid gray; padding: 8px; text-align: left; background-color: lightgray; color: black;">
                <td> ${key} </td>
            </tr>
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
                <td> ${item.name} </td>
                <td> ${item.address} </td>
                <td> ${item.action} </td>
                <td> ${beforeTable(getUpdatedValues(item.before, item.after))} </td>
            </tr>
            `;
            });
        });

        var table = table1 += `</table>`;

        let myHtml = ` 
        
    <style>
      table {
        border-collapse: collapse;
        width: 100%;
        padding: 5px;
        border: 1px solid black;
      }

      th, td {
        padding: 8px;
        text-align: left;
        border: 1px solid gray;
      }

      tr.expanded td {
        height: auto !important;
      }
    </style>

        
        
        
   ${table}



    <script>
      function expandCell(cell) {

        let id = cell.id;
        let data = JSON.parse(cell.dataset.row);
        
        var cell = document.getElementById(id);
			
        if (cell.getElementsByTagName("table").length > 0) {
            cell.removeChild(cell.getElementsByTagName("table")[0]);
            cell.innerText="Click To Expand";
            return;
        }

        var table = document.createElement("table");

        // Create a header row
        var headerRow = table.insertRow(0);
        if(typeof data !== 'string') {
            for (var key in data[0]) {
                var headerCell = headerRow.insertCell(-1);
                headerCell.innerHTML = key;
            }

            // Create a row for each object in the JSON data
            for (var i = 0; i < data.length; i++) {
                var dataRow = table.insertRow(-1);
                for (var key in data[i]) {
                    var dataCell = dataRow.insertCell(-1);
                    dataCell.innerHTML = data[i][key];
                }
            }
            
        } else {
            var headerRow = table.insertRow(0);
            var headerCell = headerRow.insertCell(-1);
            headerCell.innerHTML = data;
        }
        
        cell.innerText="";
        cell.appendChild(table);

        let isExpanded = row.classList.contains('expanded');
        row.classList.toggle('expanded');
        row.style.height = isExpanded ? '' : (row.offsetHeight * 2) + 'px';
      }
    </script>
        
        `;
        let htmlContent = `<html><body> ${myHtml} </body></html>`;
        panel.webview.html = htmlContent;
    };
}

export function activate(context: vscode.ExtensionContext) {
    const command = vscode.commands.registerCommand('extension.openTableView', () => {
        panel.reveal();
    });

    context.subscriptions.push(command);
}
