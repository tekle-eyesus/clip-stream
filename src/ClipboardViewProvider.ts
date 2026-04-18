import * as vscode from 'vscode';
import type { ClipboardEntry } from './ClipboardManager';

type WebviewInboundMessage = {
    type: 'insert' | 'copy' | 'delete' | 'pinToggle' | 'setNote' | 'requestNote';
    value?: string;
    note?: string;
};

export class ClipboardViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'clip-stream-view';
    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _onMessage: (data: WebviewInboundMessage) => void,
    ) { }

    public resolveWebviewView(webviewView: vscode.WebviewView) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage((data) => this._onMessage(data));
    }

    public updateList(items: ClipboardEntry[], pinnedItems: string[]) {
        if (this._view) {
            this._view.webview.postMessage({ type: 'update', items, pinnedItems });
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'style.css'));

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${styleUri}" rel="stylesheet">
            </head>
            <body>
                <div class="toolbar">
                    <input id="search-input" type="search" placeholder="Search clips (Ctrl/Cmd+F)" aria-label="Search clips" />
                    <div class="kbd-hint">Arrows: Select | Enter: Insert | P: Pin | N: Note | Del: Remove</div>
                </div>
                <div id="item-list"></div>
                <script src="${scriptUri}"></script>
            </body>
            </html>`;
    }
}