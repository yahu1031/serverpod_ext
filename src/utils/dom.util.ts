// import { Action, Diff, Plan, ReleaseInterface, ResourceId, Warning } from "../base/interfaces/dom.interface";
// import { ChangeType } from "./enums.util";


// export function accordion(element: Element): void {
//     const changes = element.parentElement?.getElementsByClassName('changes');
//     for (var i = 0; i < (changes ?? '').length; i++) {
//         toggleClass(changes![i], 'collapsed');
//     }
// }

// export function toggleClass(element: Element | null | undefined, className: string): void {
//     if (element !== null && element) {
//         if (!element.className.match(className)) {
//             element.className += ' ' + className;
//         }
//         else {
//             element.className = element.className.replace(className, '');
//         }
//     }
// }

// export function addClass(element: Element | null | undefined, className: string): void {
//     if (element !== null && element) {
//         if (!element.className.match(className)) {
//             element.className += ' ' + className;
//         }
//     }
// }

// export function removeClass(element: Element | null | undefined, className: string): void {
//     if (element !== null && element) {
//         element.className = element.className.replace(className, '');
//     }
// }

// export function expandAll(): void {
//     const sections = document.querySelectorAll('.changes.collapsed');

//     for (var i = 0; i < sections.length; i++) {
//         toggleClass(sections[i], 'collapsed');
//     }

//     toggleClass(document.querySelector('.expand-all'), 'hidden');
//     toggleClass(document.querySelector('.collapse-all'), 'hidden');
// }

// export function collapseAll(): void {
//     const sections = document.querySelectorAll('.changes:not(.collapsed)');

//     for (var i = 0; i < sections.length; i++) {
//         toggleClass(sections[i], 'collapsed');
//     }

//     toggleClass(document.querySelector('.expand-all'), 'hidden');
//     toggleClass(document.querySelector('.collapse-all'), 'hidden');
// }

// export function createModalContainer(): HTMLElement {
//     const modalElement = document.createElement('div');
//     modalElement.id = 'modal-container';

//     document.body.appendChild(modalElement);

//     return modalElement;
// }

// export function closeModal(): void {
//     const modalElement = document.getElementById('modal-container');
//     if (modalElement !== null) {
//         document.body.removeChild(modalElement);
//     }
// }

// export function getCurrentVersion(): string {
//     return releases[0].version;
// }

// export function getLastUsedVersion(): string | null {
//     return window.localStorage.getItem('lastUsedVersion');
// }

// export function updateLastUsedVersion(): void {
//     window.localStorage.setItem('lastUsedVersion', getCurrentVersion());
// }

// export function getReleases(): ReleaseInterface[] {
//     return releases;
// }

// //New releases should always go at the top of this list.
// let releases: ReleaseInterface[] = [
//     {
//         version: 'v1.3',
//         notes: [
//             'A command-line version of Prettyplan is now available! Check it out on <a target="_blank" href="https://github.com/chrislewisdev/prettyplan-cli">GitHub</a>'
//         ]
//     },
//     {
//         version: 'v1.2',
//         notes: [
//             '<em>&lt;computed&gt;</em> values now display properly instead of being interpreted as HTML (<a target="_blank" href="https://github.com/chrislewisdev/prettyplan/issues/2">#2</a>)',
//             'Resource changes with <em>(forces new resource)</em> now have this highlighted in the table of changes (<a target="_blank" href="https://github.com/chrislewisdev/prettyplan/issues/3">#3</a>)',
//             'Italics for <em>&lt;computed&gt;</em> or <em>${variable}</em> values to help set them apart from regular values'
//         ]
//     },
//     {
//         version: 'v1.1',
//         notes: [
//             'Added handy release notes!',
//             'Fixed parsing of large AWS IAM policy documents (<a target="_blank" href="https://github.com/chrislewisdev/prettyplan/issues/10">#10</a>)'
//         ]
//     },
//     {
//         version: 'v1.0',
//         notes: [
//             'See your Terraform plans transformed into a beautiful tabulated format!',
//             'Support for prettyifying JSON content for easier reading',
//             'Theming consistent with the Terraform colour scheme',
//             'Works in Firefox, Chrome, and Edge'
//         ]
//     }
// ];


// export function clearExistingOutput(): void {
//     removeChildren(document.getElementById('errors'));
//     removeChildren(document.getElementById('warnings'));
//     removeChildren(document.getElementById('actions'));
// }

// export function hideParsingErrorMessage(): void {
//     addClass(document.getElementById('parsing-error-message'), 'hidden');
// }

// export function displayParsingErrorMessage(): void {
//     removeClass(document.getElementById('parsing-error-message'), 'hidden');
// }

// export function unHidePlan(): void {
//     removeClass(document.getElementById('prettyplan'), 'hidden');
// }

// export function showReleaseNotification(version: string): void {
//     const notificationElement = document.getElementById('release-notification');
//     if (notificationElement) {
//         notificationElement.innerHTML = components.releaseNotification(version);
//         removeClass(notificationElement, 'hidden');
//     }
// }

// export function hideReleaseNotification(): void {
//     addClass(document.getElementById('release-notification'), 'dismissed');
// }

// export function showReleaseNotes(): void {
//     createModalContainer().innerHTML = components.modal(components.releaseNotes(getReleases()));
// }

// export function render(plan: Plan): void {
//     if (plan.warnings) {
//         const warningList = document.getElementById('warnings');
//         if (warningList) {
//             warningList.innerHTML = plan.warnings.map(components.warning).join('');
//         }
//     }

//     if (plan.actions) {
//         const actionList = document.getElementById('actions');
//         if (actionList) {
//             actionList.innerHTML = plan.actions.map(components.action).join('');
//         }
//     }
// }

// const components = {
//     badge: (label: string): string => `
//         <span class="badge">${label}</span>
//     `,

//     id: (id: ResourceId): string => `
//         <span class="id">
//             ${id.prefixes.map(prefix =>
//         `<span class="id-segment prefix">${prefix}</span>`
//     ).join('')}
//             <span class="id-segment type">${id.type}</span>
//             <span class="id-segment name">${id.name}</span>
//         </span>
//     `,

//     warning: (warning: Warning): string => `
//         <li>
//             ${components.badge('warning')}
//             ${components.id(warning.id)}
//             <span>${warning.detail}</span>
//         </li>
//     `,

//     changeCount: (count: number): string => `
//         <span class="change-count">
//             ${count + ' change' + (count > 1 ? 's' : '')}
//         </span>
//     `,

//     change: (change: Diff): string => `
//         <tr>
//             <td class="property">
//                 ${change.property}
//                 ${change.forcesNewResource ? `<br /><span class="forces-new-resource">(forces new resource)</span>` : ''}
//             </td>
//             <td class="old-value">${change.old ? prettify(change.old) : ''}</td>
//             <td class="new-value">${prettify(change.new)}</td>
//         </tr>
//     `,

//     action: (action: Action): string => `
//         <li class="${action.type}">
//             <div class="summary" onclick="accordion(this)">
//                 ${components.badge(action.type)}
//                 ${components.id(action.id)}
//                 ${action.changes ? components.changeCount(action.changes.length) : ''}
//             </div>
//             <div class="changes collapsed">
//                 <table>
//                     ${action.changes.map(components.change).join('')}
//                 </table>
//             </div>
//         </li>
//     `,

//     modal: (content: string): string => `
//         <div class="modal-pane" onclick="closeModal()"></div>
//         <div class="modal-content">
//             <div class="modal-close"><button class="text-button" onclick="closeModal()">close</button></div>
//             ${content}
//         </div>
//     `,

//     releaseNotes: (releases: ReleaseInterface[]): string => `
//         <div class="release-notes">
//             <h1>Release Notes</h1>
//             ${releases.map(components.release).join('')}
//         </div>
//     `,

//     release: (release: ReleaseInterface): string => `
//         <h2>${release.version}</h2>
//         <ul>
//             ${release.notes.map((note) => `<li>${note}</li>`).join('')}
//         </ul>
//     `,

//     releaseNotification: (version: string): string => `
//         Welcome to ${version}!
//         <button class="text-button" onclick="showReleaseNotes(); hideReleaseNotification()">View release notes?</button>
//         (or <button class="text-button" onclick="hideReleaseNotification()">ignore</button>)
//     `
// };

// function prettify(value: string): string {
//     if (value === '<computed>') {
//         return `<em>&lt;computed&gt;</em>`;
//     }
//     else if (value.startsWith('${') && value.endsWith('}')) {
//         return `<em>${value}</em>`;
//     }
//     else if (value.indexOf('\\n') >= 0 || value.indexOf('\\"') >= 0) {
//         var sanitisedValue = value.replace(new RegExp('\\\\n', 'g'), '\n')
//             .replace(new RegExp('\\\\"', 'g'), '"');

//         return `<pre>${prettifyJson(sanitisedValue)}</pre>`;
//     }
//     else {
//         return value;
//     }
// }

// function prettifyJson(maybeJson: string): string {
//     try {
//         return JSON.stringify(JSON.parse(maybeJson), null, 2);
//     }
//     catch (e) {
//         return maybeJson;
//     }
// }

// window.addEventListener('load', () => {
//     if (getCurrentVersion() !== getLastUsedVersion()) {
//         showReleaseNotification(getCurrentVersion());
//         updateLastUsedVersion();
//     }
// });

// export function removeChildren(element: Element | null | undefined): void {
//     if (element !== null && element) {
//         while (element.lastChild) {
//             element.removeChild(element.lastChild);
//         }
//     }
// }

// export function parse(terraformPlan: string): Plan {
//     var warnings = parseWarnings(terraformPlan);

//     var changeSummary = extractChangeSummary(terraformPlan);
//     var changes = extractIndividualChanges(changeSummary);

//     var plan = { warnings: warnings, actions: <any>[] };
//     for (var i = 0; i < changes.length; i++) {
//         plan.actions.push(parseChange(changes[i]));
//     }

//     return plan;
// }

// export function parseWarnings(terraformPlan: string): Warning[] {
//     let warningRegex: RegExp = new RegExp('Warning: (.*:)(.*)', 'gm');
//     let warning: RegExpExecArray | null;
//     let warnings: Warning[] = [];

//     do {
//         warning = warningRegex.exec(terraformPlan);
//         if (warning) {
//             warnings.push({ id: parseId(warning[1]), detail: warning[2] });
//         }
//     } while (warning);

//     return warnings;
// }

// export function extractChangeSummary(terraformPlan: string): string {
//     var beginActionRegex = new RegExp('Terraform will perform the following actions:', 'gm');
//     var begin = beginActionRegex.exec(terraformPlan);

//     if (begin) { return terraformPlan.substring(begin.index + 45); }
//     else { return terraformPlan; }
// }

// export function extractIndividualChanges(changeSummary: string): string[] {
//     //TODO: Fix the '-/' in '-/+' getting chopped off
//     var changeRegex = new RegExp('([~+-]|-\/\+|<=) [\\S\\s]*?((?=-\/\+|[~+-] |<=|Plan:)|$)', 'g');
//     var change;
//     var changes = [];

//     do {
//         change = changeRegex.exec(changeSummary);
//         if (change) { changes.push(change[0]); }
//     } while (change);

//     return changes;
// }

// export function parseChange(change: string): Action {
//     var changeTypeAndIdRegex = new RegExp('([~+-]|-\/\+|<=) (.*)$', 'gm');
//     var changeTypeAndId = changeTypeAndIdRegex.exec(change);
//     var changeTypeSymbol = changeTypeAndId !== null && changeTypeAndId.length > 1
//         ? changeTypeAndId![1] : '';
//     var resourceId = changeTypeAndId !== null && changeTypeAndId.length > 2 ? changeTypeAndId[2] : '';

//     var type;
//     type = parseChangeSymbol(changeTypeSymbol);

//     //Workaround for recreations showing up as '+' changes
//     if (resourceId.match('(new resource required)')) {
//         type = ChangeType.recreate;
//         resourceId = resourceId.replace(' (new resource required)', '');
//     }

//     var diffs;
//     if (type === ChangeType.create || type === ChangeType.read) {
//         diffs = parseSingleValueDiffs(change);
//     }
//     else {
//         diffs = parseNewAndOldValueDiffs(change);
//     }

//     return {
//         id: parseId(resourceId),
//         type: type,
//         changes: diffs
//     };
// }

// export function parseId(resourceId: string): ResourceId {
//     var idSegments = resourceId.split('.');
//     var resourceName = idSegments[idSegments.length - 1];
//     var resourceType = idSegments[idSegments.length - 2] || null;
//     var resourcePrefixes = idSegments.slice(0, idSegments.length - 2);

//     return { name: resourceName, type: resourceType ?? '', prefixes: resourcePrefixes };
// }

// export function parseChangeSymbol(changeTypeSymbol: string): ChangeType {
//     if (changeTypeSymbol === "-") { return ChangeType.destroy; }
//     else if (changeTypeSymbol === "+") { return ChangeType.create; }
//     else if (changeTypeSymbol === "~") { return ChangeType.update; }
//     else if (changeTypeSymbol === "<=") { return ChangeType.read; }
//     else if (changeTypeSymbol === "-/+") { return ChangeType.recreate; }
//     else { return ChangeType.unknown; }
// }

// export function parseSingleValueDiffs(change: string): Diff[] {
//     var propertyAndValueRegex = new RegExp('\\s*(.*?): *(?:<computed>|"(|[\\S\\s]*?[^\\\\])")', 'gm');
//     var diff;
//     var diffs = [];

//     do {
//         diff = propertyAndValueRegex.exec(change);
//         if (diff) {
//             diffs.push({
//                 property: diff[1].trim(),
//                 new: diff[2] !== undefined ? diff[2] : "<computed>"
//             });
//         }
//     } while (diff);

//     return diffs;
// }

// // export function parseNewAndOldValueDiffs(change: string): Diff[] {
// //     var propertyAndNewAndOldValueRegex = new RegExp('\\s*(.*?): *(?:"(|[\\S\\s]*?[^\\\\])")[\\S\\s]*?=> *(?:<computed>|"(|[\\S\\s]*?[^\\\\])")( \\(forces new resource\\))?', 'gm');
// //     var diff;
// //     var diffs = [];

// //     do {
// //         diff = propertyAndNewAndOldValueRegex.exec(change);
// //         if (diff) {
// //             diffs.push({
// //                 property: diff[1].trim(),
// //                 old: diff[2],
// //                 new: diff[3] !== undefined ? diff[3] : "<computed>",
// //                 forcesNewResource: diff[4] !== undefined
// //             });
// //         }
// //     } while (diff);
// //     return diffs;
// // }
// export function parseNewAndOldValueDiffs(change: string): Diff[] {
//     const pattern = /\s*(.*?): *"(.*?)"\s*=> *(.*?)(\s*\(forces new resource\))?/gm;
//     let match: RegExpExecArray | null;
//     const diffs: Diff[] = [];

//     while ((match = pattern.exec(change))) {
//         const [, property, oldValue, newValue, forcesNewResource] = match;
//         diffs.push({
//             property: property.trim(),
//             old: oldValue,
//             new: newValue === "<computed>" ? newValue : newValue.trim(),
//             forcesNewResource: (forcesNewResource !== undefined).toString()
//         });
//     }

//     return diffs;
// }
