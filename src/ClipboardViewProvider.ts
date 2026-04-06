import * as vscode from 'vscode';

export class ClipboardViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'clip-stream-view';
    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _onMessage: (data: { type: string; value?: string; index?: number }) => void,
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

    public updateList(items: string[]) {
        if (this._view) {
            this._view.webview.postMessage({ type: 'update', items });
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'style.css'));

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <link href="${styleUri}" rel="stylesheet">
            </head>
            <body>
                <div id="item-list"></div>
                <script src="${scriptUri}"></script>
            </body>
            </html>`;
    }
}