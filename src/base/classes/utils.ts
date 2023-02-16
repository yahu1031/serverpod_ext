export type ResourceAction = '-' | '+' | '~' | '<=' | '-/+';

export interface ResourceChange {
    key: string;
    value: string | number | Record<string, unknown> | null;
    action: ResourceAction;
    childChanges?: ResourceChange[];
}

export interface Resource {
    type: string;
    name: string;
    id: string;
    changes: ResourceChange[];
}

export function parseResourceChange(change: string): ResourceChange {
    const [keyValueString, ...childChangeStrings] = change.split('\n');
    const [key, valueString] = keyValueString.split(' = ');
    const action = key[0] as ResourceAction;
    const value =
        valueString === '(sensitive value)' ? null : JSON.parse(valueString);
    const childChanges = childChangeStrings.length
        ? childChangeStrings
            .filter((str) => !str.startsWith('#') && !str.startsWith(' '))
            .map(parseResourceChange)
        : undefined;

    return {
        key,
        value,
        action,
        childChanges,
    };
}

export function parseResource(rawResource: string) {
    try {
        const [headerLine, ...changes] = rawResource.trim().split('\n');
        const [type, name]: string[] = (headerLine.match(/"(.*?)"/g) ?? []).map((str) => str.slice(1, -1));
        var modifiedChanges: string[] = [];
        changes.forEach((change) => {
            if (!change.startsWith('#')) {
                modifiedChanges.push(change);
            }
        });
        // split each change with " " if the change starts with `~|+|-|<=|-/+ resource`
        const changeRegex = new RegExp(/(-|\+|~|<=|-\/\+) resource (.*?)/igm);
        // set of ids
        const ids = new Set<string>();
        const idMap = new Map<string, string[]>();
        modifiedChanges.forEach((change, _) => {
            if (changeRegex.test(change)) {
                const splitList = change.trim().split(' ');
                const id = splitList[2].replace('"', '').replace('"', '');
                const subId = splitList[3].replace('"', '').replace('"', '');
                if (idMap.has(id)) {
                    idMap.get(id)?.push(subId);
                } else {
                    idMap.set(id, [subId]);
                }
            }
        });
    } catch (error) {
        console.error(error);
    }
}


function parseJSON(rawJSON: string): Resource[] {
    const resourceChunks = rawJSON.split(/\n\s*\n/);
    return resourceChunks.map(parseResource as (str: string) => Resource);
}
