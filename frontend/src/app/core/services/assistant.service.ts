import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AssistantService {
  private authService = inject(AuthService);
  private readonly baseUrl = '/api/assistant/chat';
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
      const response = await fetch(this.baseUrl, {
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
        callbacks.onError('Assistent ist derzeit nicht verfuegbar.');
        return;
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let receivedDone = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop()!;

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const data = line.slice(5).trim();
            if (data === '[DONE]') {
              receivedDone = true;
            } else if (data) {
              callbacks.onToken(data);
            }
          }
        }
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

  abort(): void {
    this.abortController?.abort();
    this.abortController = null;
  }
}
