import * as vscode from "vscode";
import { ClipboardManager } from "./ClipboardManager";
import { ClipboardViewProvider } from "./ClipboardViewProvider";

export function activate(context: vscode.ExtensionContext): void {
    const clipboardManager = new ClipboardManager();
    const viewProvider = new ClipboardViewProvider(context.extensionUri, clipboardManager);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(ClipboardViewProvider.viewType, viewProvider),
    );

    const helloCommand = vscode.commands.registerCommand("clip-stream.hello", async () => {
        await vscode.window.showInformationMessage("Clip Stream is active.");
    });

    context.subscriptions.push(helloCommand);
}

export function deactivate(): void {
    // Nothing to clean up yet.
}
