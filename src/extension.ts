import * as vscode from 'vscode';
import { ClipboardViewProvider } from './ClipboardViewProvider';

export function activate(context: vscode.ExtensionContext) {
    const provider = new ClipboardViewProvider(context.extensionUri);
    let history: string[] = [];
    let lastClipboard = "";

    // Register Sidebar
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(ClipboardViewProvider.viewType, provider)
    );

    // Clipboard Polling Logic
    const pollInterval = setInterval(async () => {
        const currentClip = await vscode.env.clipboard.readText();

        if (currentClip && currentClip !== lastClipboard) {
            lastClipboard = currentClip;

            // Add to start, remove duplicates, limit to 20
            history = [currentClip, ...history.filter(i => i !== currentClip)].slice(0, 20);
            provider.updateList(history);
        }
    }, 1000);

    context.subscriptions.push({ dispose: () => clearInterval(pollInterval) });

    // Command to focus
    context.subscriptions.push(vscode.commands.registerCommand('clip-stream.focus', () => {
        vscode.commands.executeCommand('workbench.view.extension.clip-stream-explorer');
    }));
}