import * as vscode from "vscode";
import { ClipboardManager } from "./ClipboardManager";

export class ClipboardViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = "clipStream.sidebar";

    constructor(
        private readonly extensionUri: vscode.Uri,
        private readonly clipboardManager: ClipboardManager,
    ) { }

    resolveWebviewView(webviewView: vscode.WebviewView): void {
        const webview = webviewView.webview;

        webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, "media")],
        };

        webview.html = this.getHtml(webview);

        webview.onDidReceiveMessage((message) => {
            if (message.type === "clear") {
                this.clipboardManager.clearHistory();
            }
        });
    }

    private getHtml(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, "media", "main.js"));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, "media", "style.css"));

        return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="${styleUri}" />
    <title>Clip Stream</title>
  </head>
  <body>
    <section class="container">
      <h1>Clip Stream</h1>
      <p class="subtitle">Clipboard history will appear here.</p>
      <button id="clearBtn" type="button">Clear History</button>
      <ul id="historyList"></ul>
    </section>
    <script src="${scriptUri}"></script>
  </body>
</html>`;
    }
}
