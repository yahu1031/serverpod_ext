import { CancellationToken, CompletionContext, CompletionItem, CompletionList, Disposable, DocumentSelector, languages, Position, TextDocument } from "vscode";

export class Snippet{
    static disposableSnippet = (documentSelector: DocumentSelector): Disposable => {
        return languages.registerCompletionItemProvider(documentSelector, {
            provideCompletionItems: (_document: TextDocument, position: Position, _token: CancellationToken, _context: CompletionContext): CompletionItem[] | CompletionList | undefined => {
                console.log('provideCompletionItems triggered for YAML');
                if (position.line <= 0) {
                    return;
                }
            },
        });
    };
}