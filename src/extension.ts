import * as vscode from 'vscode';
import { ClipboardViewProvider } from './ClipboardViewProvider';

export function activate(context: vscode.ExtensionContext) {
    // 1. Load existing history from storage
    let history: string[] = context.globalState.get('clipHistory', []);
    const deletedHistory = new Set<string>(context.globalState.get<string[]>('deletedClipHistory', []));
    const pinnedHistory = new Set<string>(context.globalState.get<string[]>('pinnedClipHistory', []));
    let lastClipboard = history[0] ?? '';

    const getOrderedHistory = (): string[] => {
        const pinned = history.filter((item) => pinnedHistory.has(item));
        const unpinned = history.filter((item) => !pinnedHistory.has(item));
        return [...pinned, ...unpinned];
    };

    const updateView = () => {
        provider.updateList(getOrderedHistory(), [...pinnedHistory]);
    };

    const provider = new ClipboardViewProvider(context.extensionUri, async (data) => {
        switch (data.type) {
            case 'insert': {
                const value = data.value ?? '';
                await vscode.window.activeTextEditor?.edit((editBuilder) => {
                    editBuilder.insert(vscode.window.activeTextEditor!.selection.active, value);
                });
                break;
            }
            case 'copy': {
                const value = data.value ?? '';
                await vscode.env.clipboard.writeText(value);
                vscode.window.showInformationMessage('Copied back to clipboard!');
                break;
            }
            case 'delete': {
                const value = data.value ?? '';
                if (!value) {
                    break;
                }

                history = history.filter((item) => item !== value);
                deletedHistory.add(value);
                pinnedHistory.delete(value);

                await context.globalState.update('clipHistory', history);
                await context.globalState.update('deletedClipHistory', [...deletedHistory]);
                await context.globalState.update('pinnedClipHistory', [...pinnedHistory]);
                updateView();
                lastClipboard = history[0] ?? '';
                break;
            }
            case 'pinToggle': {
                const value = data.value ?? '';
                if (!value) {
                    break;
                }

                if (pinnedHistory.has(value)) {
                    pinnedHistory.delete(value);
                } else {
                    pinnedHistory.add(value);
                }

                await context.globalState.update('pinnedClipHistory', [...pinnedHistory]);
                updateView();
                break;
            }
        }
    });

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(ClipboardViewProvider.viewType, provider)
    );

    const pollInterval = setInterval(async () => {
        const currentClip = await vscode.env.clipboard.readText();

        if (currentClip && deletedHistory.has(currentClip)) {
            // Keep deleted items from being re-added by polling the current clipboard value.
            lastClipboard = currentClip;
            return;
        }

        if (currentClip && currentClip !== lastClipboard) {
            lastClipboard = currentClip;
            history = [currentClip, ...history.filter(i => i !== currentClip)].slice(0, 20);

            // 2. Save to storage
            context.globalState.update('clipHistory', history);

            updateView();
        }
    }, 1000);

    context.subscriptions.push({ dispose: () => clearInterval(pollInterval) });

    // Initial update to show saved items on load
    setTimeout(() => updateView(), 500);

    // Add a "Clear" command
    context.subscriptions.push(vscode.commands.registerCommand('clip-stream.clear', () => {
        history = [];
        context.globalState.update('clipHistory', []);
        pinnedHistory.clear();
        context.globalState.update('pinnedClipHistory', []);
        updateView();
        lastClipboard = '';
    }));
}