<p align="center">
	<img src="https://res.cloudinary.com/dewvz4zxk/image/upload/v1776501318/copy-paste_ooz86l.png" alt="Clip Stream logo" width="100" />
</p>

<h1 align="center">Clip Stream</h1>

<p align="center">
	A VS Code extension that captures your clipboard history and keeps it ready in a dedicated sidebar panel.
</p>

<p align="center">
	<img src="https://img.shields.io/badge/version-0.0.1-blue" alt="Version" />
	<img src="https://img.shields.io/badge/VS%20Code-%5E1.80.0-007ACC" alt="VS Code" />
	<img src="https://img.shields.io/badge/TypeScript-%5E5.0.0-3178C6" alt="TypeScript" />
	<img src="https://img.shields.io/badge/Node.js-%5E22.x-339933" alt="Node.js" />
	<img src="https://img.shields.io/badge/license-MIT-green" alt="License" />
</p>

Clip Stream automatically captures text you copy, stores it in order, and lets you revisit, re-insert, pin, search, or remove previous clips without leaving your editor.

## Highlights

- Clean sidebar history for copied text.
- Persistent storage across VS Code restarts.
- Pin important clips to keep them at the top.
- Add short notes to clips for quick reminders or labels.
- Reorder clips with drag-and-drop using reorder mode.
- Insert, copy, delete, and clear clips quickly from the panel.
- Keyboard-friendly navigation for fast reuse.

---

## Features

- **Automatic clipboard capture** — polls the clipboard every second and records any new text you copy, keeping the most recent 20 entries.
- **Persistent history** — clipboard entries survive VS Code restarts; history is saved to global extension storage.
- **Pin clips** — pin important entries to the top of the list so they are never pushed out by new copies.
- **Clip notes** — attach a short note of up to 10 words to any clip for reminders or labeling.
- **Drag reorder mode** — double-click the Reorder button, then drag and drop clips to shuffle their order.
- **Delete clips** — remove individual entries from the history; deleted items are ignored if copied again.
- **Insert into editor** — click or press Enter on any clip to insert it at the current cursor position in the active editor.
- **Copy to clipboard** — copy any historical clip back to the system clipboard with a single action.
- **Search / filter** — use the built-in search bar (Ctrl/Cmd+F) to filter clips by content in real time.
- **Keyboard navigation** — navigate the list with arrow keys, press Enter to insert, P to pin/unpin, and Delete to remove without touching the mouse.
- **Clear all** — a toolbar button wipes the entire history in one click.

---

## Tech Stack

| Layer              | Technology                           |
| ------------------ | ------------------------------------ |
| Extension language | TypeScript 5                         |
| Extension host API | VS Code Extension API (vscode ^1.80) |
| Runtime            | Node.js 22                           |
| Webview UI         | HTML5 + CSS3 + Vanilla JavaScript    |
| Build tool         | TypeScript compiler (`tsc`)          |

---

## Project Structure

```
clip-stream/
├── src/
│   ├── extension.ts          # Extension activation, command registration, clipboard polling
│   ├── ClipboardManager.ts   # Core clipboard history logic (add, get, clear)
│   └── ClipboardViewProvider.ts  # Sidebar webview provider and message bus
├── media/
│   ├── main.js               # Webview client-side behaviour (rendering, keyboard nav, search)
│   └── style.css             # Webview styling
├── .vscode/
│   └── launch.json           # Debug configuration for Extension Development Host
├── package.json              # Extension manifest and npm scripts
└── tsconfig.json             # TypeScript compiler settings
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) v18 or later
- [VS Code](https://code.visualstudio.com) v1.80 or later

### Installation (development)

```bash
# 1. Install dependencies
npm install

# 2. Start the TypeScript watch compiler
npm run watch
```

Then press **F5** in VS Code to launch a new Extension Development Host window with Clip Stream loaded.

### Running a production build

```bash
npm run compile
```

---

## Usage

1. Open VS Code and activate the extension (it starts automatically on launch).
2. Copy any text as you normally would — Clip Stream captures it instantly.
3. Open the **Clip Stream** panel in the Activity Bar to view your history.
4. Use the toolbar search box to filter entries.
5. Click an entry (or navigate with arrow keys and press Enter) to insert it at the cursor.
6. Press **P** on a selected entry to pin it, **N** to add or edit a note, and **Delete** to remove it.
7. Double-click the **Reorder** button to turn reorder mode on, then drag and drop clips to reposition them.
8. Click the **Clear All Clips** button in the panel title bar to reset the entire history.

---

## Commands

| Command             | Description                         |
| ------------------- | ----------------------------------- |
| `clip-stream.focus` | Open the Clipboard Stream panel     |
| `clip-stream.clear` | Clear all clipboard history entries |

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

## License

[MIT](https://choosealicense.com/licenses/mit/)
