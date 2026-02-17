type SessionEventData = {
  type: string;
  data: string;
  timestamp: string;
};

const FLUSH_INTERVAL_MS = 2000;
const MAX_BUFFER_SIZE = 50;

export class SessionRecorder {
  private sessionId: string;
  private buffer: SessionEventData[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private changeCount = 0;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  start() {
    this.flushTimer = setInterval(() => this.flush(), FLUSH_INTERVAL_MS);
  }

  stop() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush();
  }

  recordChange(changes: unknown[], fullContent?: string) {
    this.changeCount++;

    const data: Record<string, unknown> = {
      changes,
    };

    // Periodic full snapshots every 20 changes
    if (this.changeCount % 20 === 0 && fullContent !== undefined) {
      data.fullContent = fullContent;
    }

    this.addEvent("change", data);
  }

  recordKeystroke(key: string) {
    // Skip modifier-only keys
    if (
      ["Shift", "Control", "Alt", "Meta", "CapsLock"].includes(key)
    ) {
      return;
    }
    this.addEvent("keystroke", { key });
  }

  recordPaste(text: string, position?: { line: number; column: number }) {
    // Truncate paste content to 1000 chars
    const truncated = text.length > 1000 ? text.slice(0, 1000) : text;
    this.addEvent("paste", { text: truncated, position });
  }

  recordFocus() {
    this.addEvent("focus", {});
  }

  recordBlur() {
    this.addEvent("blur", {});
  }

  recordChatSend(messageLength: number) {
    this.addEvent("chat_send", { messageLength });
  }

  recordTestRun(score: number) {
    this.addEvent("test_run", { score });
  }

  private addEvent(type: string, data: unknown) {
    this.buffer.push({
      type,
      data: JSON.stringify(data),
      timestamp: new Date().toISOString(),
    });

    if (this.buffer.length >= MAX_BUFFER_SIZE) {
      this.flush();
    }
  }

  private async flush() {
    if (this.buffer.length === 0) return;

    const events = [...this.buffer];
    this.buffer = [];

    try {
      const res = await fetch("/api/session/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: this.sessionId,
          events,
        }),
      });

      if (!res.ok) {
        // Re-prepend failed events to buffer for retry
        this.buffer = [...events, ...this.buffer];
      }
    } catch {
      // Re-prepend failed events to buffer for retry
      this.buffer = [...events, ...this.buffer];
    }
  }
}
