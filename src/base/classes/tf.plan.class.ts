// import { changeSymbolParser, parseNewAndOldValueDiffs, parseDiffs } from "../../utils/dom.util";
import { ChangeType } from "../../utils/enums.util";
import { Diff, PlanAction, ResourceId, Warning } from "../interfaces/tf.plan.interface";
import { parseResource } from "./utils";

export class TfPlanner {

    public static extractPlanConfigs = (planOutput: string) => {
        // const regex = /Terraform will perform the following actions:\n([\\s\\S]+?)\nPlan: \d+ changes/;
        // const plan = regex.exec(planOutput);
        var plan = this.getPlan(planOutput);
        // console.log(plan);
        var parsedRes = parseResource(plan);
        console.log(parsedRes);

        // const getWarnings = this.getWarnings(planOutput);
        // const getPlan = this.getPlan(planOutput);
        // const getChanges = this.getChanges(getPlan);
        // console.log(getChanges);
        // console.log(getWarnings);
        // console.log(getPlan);
        // var plan: Plan = { warnings: getWarnings, actions: [] };
        // for (var i = 0; i < getChanges.length; i++) {
        //     plan.actions.push(this.parseChange(getChanges[i]));
        // }
        // return plan;
    };

    private static getPlan(planOutput: string): string {
        const identifier = 'Terraform will perform the following actions:';
        const regex = new RegExp(identifier, 'gm');
        var begin = regex.exec(planOutput);
        if (begin) {
            var subStr = planOutput.substring(begin.index + 45);
            return subStr.substring(0, subStr.indexOf('Plan:')).trim();
        } else {
            return planOutput.substring(planOutput.indexOf(identifier), planOutput.indexOf('Plan:')).trim();
        }
    }

    private static getChanges(plan: string): string[] {
        // regex to match content before the text "Plan: <any content>"
        const regex: RegExp = new RegExp('(?=[\\s\\S]*Plan: )', 'gm');
        var planChange;
        var planChanges: string[] = [];
        while ((planChange = regex.exec(plan))) {
            planChanges.push(planChange[0]);
        }
        return planChanges;
    }

    private static parseResourceID(id: string): ResourceId {
        var idSegments = id.split('.');
        var resourceName = idSegments[idSegments.length - 1];
        var resourceType = idSegments[idSegments.length - 2] || null;
        var resourcePrefixes = idSegments.slice(0, idSegments.length - 2);

        return { name: resourceName, type: resourceType, prefixes: resourcePrefixes };
    }

    private static getWarnings(plan: string): Warning[] {
        const regex: RegExp = new RegExp('Warning: (.*:)(.*)', 'gm');
        let warning: RegExpExecArray | null;
        let warnings: Warning[] = [];
        while ((warning = regex.exec(plan))) {
            warnings.push({
                id: this.parseResourceID(warning[1]),
                detail: warning[2],
            });
        }
        return warnings;
    }

    private static parseChange(change: string): PlanAction {
        const regex = new RegExp('([~+-]|-\/\+|<=) (.*)$', 'gm');
        var changeTypeAndId = regex.exec(change);
        if (changeTypeAndId !== null && changeTypeAndId.length > 2) {
            var changeTypeSymbol = changeTypeAndId[1] || '';
            var resourceId = changeTypeAndId[2] || '';

            var type;
            type = this.changeSymbolParser(changeTypeSymbol);

            //Workaround for recreations showing up as '+' changes
            if (resourceId.match('(new resource required)')) {
                type = 'recreate';
                resourceId = resourceId.replace(' (new resource required)', '');
            }

            var diffs;
            if (type === 'create' || type === 'read') {
                diffs = this.parseDiffs(change);
            }
            else {
                diffs = this.parseNewAndOldValueDiffs(change);
            }

            return {
                id: this.parseId(resourceId),
                type: type === 'create' ? ChangeType.create : type === 'read' ? ChangeType.read : type === 'update' ? ChangeType.update : type === 'destroy' ? ChangeType.destroy : type === 'recreate' ? ChangeType.recreate : ChangeType.unknown,
                changes: diffs
            };
        } else {
            return {
                id: { name: '', type: null, prefixes: [] },
                type: ChangeType.unknown,
                changes: []
            };
        }
    }

    private static parseId(resourceId: string): ResourceId {
        var idSegments = resourceId.split('.');
        var resourceName = idSegments[idSegments.length - 1];
        var resourceType = idSegments[idSegments.length - 2] || null;
        var resourcePrefixes = idSegments.slice(0, idSegments.length - 2);

        return { name: resourceName, type: resourceType, prefixes: resourcePrefixes };
    }


    private static changeSymbolParser(changeTypeSymbol: string): ChangeType {
        if (changeTypeSymbol === "-") { return ChangeType.destroy; }
        else if (changeTypeSymbol === "+") { return ChangeType.create; }
        else if (changeTypeSymbol === "~") { return ChangeType.update; }
        else if (changeTypeSymbol === "<=") { return ChangeType.read; }
        else if (changeTypeSymbol === "-/+") { return ChangeType.recreate; }
        else { return ChangeType.unknown; }
    }

    private static parseDiffs(change: string): Diff[] {
        const regex = new RegExp('\\s*(.*?): *(?:<computed>|"(|[\\S\\s]*?[^\\\\])")', 'gm');
        var diff;
        var diffs = [];

        do {
            diff = regex.exec(change);
            if (diff) {
                diffs.push({
                    property: diff[1].trim(),
                    new: diff[2] !== undefined ? diff[2] : "<computed>"
                });
            }
        } while (diff);

        return diffs;
    }

    private static parseNewAndOldValueDiffs(change: string): Diff[] {
        const regex = new RegExp('\\s*(.*?): *(?:"(|[\\S\\s]*?[^\\\\])")[\\S\\s]*?=> *(?:<computed>|"(|[\\S\\s]*?[^\\\\])")( \\(forces new resource\\))?', 'gm');
        var diff;
        var diffs: Diff[] = [];

        do {
            diff = regex.exec(change);
            if (diff) {
                diffs.push({
                    property: diff[1].trim(),
                    old: diff[2],
                    new: diff[3] !== undefined ? diff[3] : "<computed>",
                    forcesNewResource: diff[4]
                });
            }
        } while (diff);

        return diffs;
    }
}