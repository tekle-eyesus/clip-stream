export class ClipboardManager {
    private history: string[] = [];

    addEntry(text: string): void {
        const value = text.trim();
        if (!value) {
            return;
        }

        this.history.unshift(value);
        this.history = this.history.slice(0, 50);
    }

    getHistory(): string[] {
        return [...this.history];
    }

    clearHistory(): void {
        this.history = [];
    }
}
