import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AssistantService {
  private authService = inject(AuthService);
  private readonly baseUrl = '/api/assistant';
  private abortController: AbortController | null = null;

  async sendMessage(
    message: string,
    callbacks: {
      onToken: (text: string) => void;
      onDone: () => void;
      onError: (error: string) => void;
    }
  ): Promise<void> {
    this.abort();
    this.abortController = new AbortController();

    const token = this.authService.getAccessToken();

    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message }),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          callbacks.onError('Zugriff verweigert.');
          return;
        }
        callbacks.onError('Assistent ist derzeit nicht verfügbar.');
        return;
      }

      if (!response.body) {
        callbacks.onError('Keine Antwort vom Assistenten.');
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let receivedDone = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop()!;

        let currentEventType = 'message';
        const dataLines: string[] = [];

        const processEvent = () => {
          if (dataLines.length === 0) return;
          const data = dataLines.join('\n');
          dataLines.length = 0;

          if (currentEventType === 'error') {
            callbacks.onError(data);
            receivedDone = true;
          } else if (data === '[DONE]') {
            receivedDone = true;
          } else if (data) {
            callbacks.onToken(data);
          }
          currentEventType = 'message';
        };

        for (const line of lines) {
          if (line.startsWith('event:')) {
            currentEventType = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            dataLines.push(line.slice(5).trim());
          } else if (line === '') {
            processEvent();
          }
        }

        // Flush remaining data lines (incomplete event without trailing blank line)
        processEvent();
      }

      if (receivedDone) {
        callbacks.onDone();
      } else {
        callbacks.onError('[Antwort abgebrochen]');
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      callbacks.onError('Verbindung unterbrochen.');
    } finally {
      this.abortController = null;
    }
  }

  async clearHistory(): Promise<void> {
    const token = this.authService.getAccessToken();
    try {
      await fetch(`${this.baseUrl}/history`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    } catch {
      // Silently ignore - clearing history is best-effort
    }
  }

  abort(): void {
    this.abortController?.abort();
    this.abortController = null;
  }
}
