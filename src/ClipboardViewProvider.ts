import * as vscode from 'vscode';

export class ClipboardViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'clip-stream-view';
    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri) { }

    public resolveWebviewView(webviewView: vscode.WebviewView) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(data => {
            switch (data.type) {
                case 'insert':
                    vscode.window.activeTextEditor?.edit(editBuilder => {
                        editBuilder.insert(vscode.window.activeTextEditor!.selection.active, data.value);
                    });
                    break;
                case 'copy':
                    vscode.env.clipboard.writeText(data.value);
                    vscode.window.showInformationMessage('Copied back to clipboard!');
                    break;
            }
        });
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