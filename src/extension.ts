import * as vscode from 'vscode';
import { ClipboardManager, type ClipboardEntry } from './ClipboardManager';
import { ClipboardViewProvider } from './ClipboardViewProvider';

const CLIP_HISTORY_KEY = 'clipHistory';
const DELETED_HISTORY_KEY = 'deletedClipHistory';
const PINNED_HISTORY_KEY = 'pinnedClipHistory';
const normalizeClipText = (value: string): string => value.trim();

export function activate(context: vscode.ExtensionContext) {
    const storedHistory = context.globalState.get<unknown[]>(CLIP_HISTORY_KEY, []);
    const clipboardManager = new ClipboardManager(ClipboardManager.normalizeHistory(storedHistory));
    const deletedHistory = new Set<string>(
        context.globalState
            .get<string[]>(DELETED_HISTORY_KEY, [])
            .map((value) => normalizeClipText(value))
            .filter((value) => Boolean(value))
    );
    const pinnedHistory = new Set<string>(context.globalState.get<string[]>(PINNED_HISTORY_KEY, []));
    let lastClipboard = normalizeClipText(clipboardManager.getHistory()[0]?.text ?? '');

    void context.globalState.update(CLIP_HISTORY_KEY, clipboardManager.getHistory());
    void context.globalState.update(DELETED_HISTORY_KEY, [...deletedHistory]);

    const getOrderedHistory = (): ClipboardEntry[] => {
        const history = clipboardManager.getHistory();
        const pinned = history.filter((item) => pinnedHistory.has(item.text));
        const unpinned = history.filter((item) => !pinnedHistory.has(item.text));
        return [...pinned, ...unpinned];
    };

    const persistState = async () => {
        await Promise.all([
            context.globalState.update(CLIP_HISTORY_KEY, clipboardManager.getHistory()),
            context.globalState.update(DELETED_HISTORY_KEY, [...deletedHistory]),
            context.globalState.update(PINNED_HISTORY_KEY, [...pinnedHistory]),
        ]);
    };

    const updateView = () => {
        provider.updateList(getOrderedHistory(), [...pinnedHistory]);
    };

    const saveNoteForClip = async (text: string, rawNote: string): Promise<boolean> => {
        const submittedNote = rawNote.trim().replace(/\s+/g, ' ');
        const noteWordCount = submittedNote ? submittedNote.split(' ').filter(Boolean).length : 0;

        if (noteWordCount > 10) {
            vscode.window.showWarningMessage('Notes must contain up to 10 words.');
            return false;
        }

        const note = ClipboardManager.sanitizeNote(submittedNote);
        const updated = clipboardManager.setNote(text, note);

        if (!updated) {
            return false;
        }

        await context.globalState.update(CLIP_HISTORY_KEY, clipboardManager.getHistory());
        updateView();
        return true;
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

                const removed = clipboardManager.deleteEntry(value);
                if (!removed) {
                    break;
                }

                deletedHistory.add(normalizeClipText(value));
                pinnedHistory.delete(value);

                await persistState();
                updateView();
                lastClipboard = normalizeClipText(clipboardManager.getHistory()[0]?.text ?? '');
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

                await context.globalState.update(PINNED_HISTORY_KEY, [...pinnedHistory]);
                updateView();
                break;
            }
            case 'setNote': {
                const value = data.value ?? '';
                if (!value) {
                    break;
                }

                await saveNoteForClip(value, data.note ?? '');
                break;
            }
            case 'requestNote': {
                const value = data.value ?? '';
                if (!value) {
                    break;
                }

                const initialNote = (data.note ?? '').trim().replace(/\s+/g, ' ');
                const enteredNote = await vscode.window.showInputBox({
                    title: 'Clip Note',
                    prompt: 'Add a short note for this clip (max 10 words). Leave empty to clear.',
                    value: initialNote,
                    ignoreFocusOut: true,
                    validateInput: (rawInput) => {
                        const normalized = rawInput.trim().replace(/\s+/g, ' ');
                        const words = normalized ? normalized.split(' ').filter(Boolean).length : 0;
                        return words > 10 ? 'Notes are limited to 10 words.' : undefined;
                    },
                });

                if (enteredNote === undefined) {
                    break;
                }

                await saveNoteForClip(value, enteredNote);
                break;
            }
            case 'reorder': {
                const source = data.value ?? '';
                const target = data.targetValue ?? '';

                if (!source || !target || source === target) {
                    break;
                }

                const isSourcePinned = pinnedHistory.has(source);
                const isTargetPinned = pinnedHistory.has(target);

                if (isSourcePinned !== isTargetPinned) {
                    vscode.window.showInformationMessage('Reordering is allowed only within pinned or unpinned groups.');
                    break;
                }

                const moved = clipboardManager.moveEntryBefore(source, target);
                if (!moved) {
                    break;
                }

                await context.globalState.update(CLIP_HISTORY_KEY, clipboardManager.getHistory());
                updateView();
                break;
            }
        }
    });

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(ClipboardViewProvider.viewType, provider)
    );

    const pollInterval = setInterval(async () => {
        const currentClip = normalizeClipText(await vscode.env.clipboard.readText());

        if (currentClip && deletedHistory.has(currentClip)) {
            // Keep deleted items from being re-added by polling the current clipboard value.
            lastClipboard = currentClip;
            return;
        }

        if (currentClip && currentClip !== lastClipboard) {
            lastClipboard = currentClip;
            clipboardManager.upsertEntry(currentClip);

            void context.globalState.update(CLIP_HISTORY_KEY, clipboardManager.getHistory());

            updateView();
        }
    }, 1000);

    context.subscriptions.push({ dispose: () => clearInterval(pollInterval) });

    // Initial update to show saved items on load
    setTimeout(() => updateView(), 500);

    // Add a "Clear" command
    context.subscriptions.push(vscode.commands.registerCommand('clip-stream.clear', () => {
        clipboardManager.clearHistory();
        void context.globalState.update(CLIP_HISTORY_KEY, []);
        pinnedHistory.clear();
        deletedHistory.clear();
        void context.globalState.update(PINNED_HISTORY_KEY, []);
        void context.globalState.update(DELETED_HISTORY_KEY, []);
        updateView();
        lastClipboard = '';
    }));
}