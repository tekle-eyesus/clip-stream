import * as vscode from 'vscode';
import { ClipboardViewProvider } from './ClipboardViewProvider';

export function activate(context: vscode.ExtensionContext) {
    const provider = new ClipboardViewProvider(context.extensionUri);

    // 1. Load existing history from storage
    let history: string[] = context.globalState.get('clipHistory', []);
    let lastClipboard = history[0] ?? '';

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(ClipboardViewProvider.viewType, provider)
    );

    const pollInterval = setInterval(async () => {
        const currentClip = await vscode.env.clipboard.readText();

        if (currentClip && currentClip !== lastClipboard) {
            lastClipboard = currentClip;
            history = [currentClip, ...history.filter(i => i !== currentClip)].slice(0, 20);

            // 2. Save to storage
            context.globalState.update('clipHistory', history);

            provider.updateList(history);
        }
    }, 1000);

    context.subscriptions.push({ dispose: () => clearInterval(pollInterval) });

    // Initial update to show saved items on load
    setTimeout(() => provider.updateList(history), 500);

    // Add a "Clear" command
    context.subscriptions.push(vscode.commands.registerCommand('clip-stream.clear', () => {
        history = [];
        context.globalState.update('clipHistory', []);
        provider.updateList([]);
    }));
}