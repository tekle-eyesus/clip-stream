# Clip Stream

Clip Stream is a VS Code extension starter project for building a clipboard history sidebar.

## Structure

- .vscode/launch.json: Debug configuration for Extension Development Host
- src/extension.ts: Extension activation and command registration
- src/ClipboardManager.ts: Clipboard history logic
- src/ClipboardViewProvider.ts: Sidebar webview provider
- media/main.js: Webview client-side behavior
- media/style.css: Webview styling
- package.json: Extension manifest
- tsconfig.json: TypeScript compiler settings

## Next Steps

1. Run npm install
2. Run npm run watch
3. Press F5 to launch the extension in the Extension Development Host
