export type ClipboardEntry = {
    text: string;
    note?: string;
};

const MAX_HISTORY_ITEMS = 20;
const MAX_NOTE_WORDS = 10;

const normalizeText = (text: string): string => text.trim();

const normalizeNote = (note: string): string => note.trim().replace(/\s+/g, ' ');

const limitNoteWords = (note: string): string => {
    const normalized = normalizeNote(note);

    if (!normalized) {
        return '';
    }

    return normalized.split(' ').filter(Boolean).slice(0, MAX_NOTE_WORDS).join(' ');
};

const isClipboardEntry = (value: unknown): value is ClipboardEntry => {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const candidate = value as { text?: unknown; note?: unknown };

    return typeof candidate.text === 'string' && (
        candidate.note === undefined || typeof candidate.note === 'string'
    );
};

export class ClipboardManager {
    private history: ClipboardEntry[] = [];

    constructor(initialHistory: ClipboardEntry[] = []) {
        this.history = ClipboardManager.normalizeHistory(initialHistory);
    }

    static normalizeHistory(storedHistory: unknown[]): ClipboardEntry[] {
        const history: ClipboardEntry[] = [];
        const seen = new Set<string>();

        for (const item of storedHistory) {
            const entry = typeof item === 'string' ? { text: item } : item;

            if (!isClipboardEntry(entry)) {
                continue;
            }

            const text = normalizeText(entry.text);
            if (!text || seen.has(text)) {
                continue;
            }

            seen.add(text);

            const note = entry.note ? limitNoteWords(entry.note) : '';
            history.push(note ? { text, note } : { text });

            if (history.length >= MAX_HISTORY_ITEMS) {
                break;
            }
        }

        return history;
    }

    static sanitizeNote(note: string): string {
        return limitNoteWords(note);
    }

    getHistory(): ClipboardEntry[] {
        return this.history.map((entry) => ({ ...entry }));
    }

    upsertEntry(text: string): boolean {
        const normalizedText = normalizeText(text);

        if (!normalizedText) {
            return false;
        }

        const existingIndex = this.history.findIndex((entry) => entry.text === normalizedText);
        const existingEntry = existingIndex >= 0 ? this.history[existingIndex] : { text: normalizedText };

        if (existingIndex >= 0) {
            this.history.splice(existingIndex, 1);
        }

        this.history.unshift({ ...existingEntry });
        this.history = this.history.slice(0, MAX_HISTORY_ITEMS);
        return true;
    }

    setNote(text: string, note: string): boolean {
        const normalizedText = normalizeText(text);

        if (!normalizedText) {
            return false;
        }

        const entry = this.history.find((item) => item.text === normalizedText);
        if (!entry) {
            return false;
        }

        const sanitizedNote = limitNoteWords(note);
        if (sanitizedNote) {
            entry.note = sanitizedNote;
        } else {
            delete entry.note;
        }

        return true;
    }

    deleteEntry(text: string): boolean {
        const normalizedText = normalizeText(text);

        if (!normalizedText) {
            return false;
        }

        const nextHistory = this.history.filter((entry) => entry.text !== normalizedText);

        if (nextHistory.length === this.history.length) {
            return false;
        }

        this.history = nextHistory;
        return true;
    }

    clearHistory(): void {
        this.history = [];
    }
}
