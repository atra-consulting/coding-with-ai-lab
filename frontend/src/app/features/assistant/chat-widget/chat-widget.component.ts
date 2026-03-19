import {
  Component,
  inject,
  signal,
  computed,
  ElementRef,
  viewChild,
  OnDestroy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faComment,
  faTimes,
  faPaperPlane,
  faMinus,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { AssistantService } from '../../../core/services/assistant.service';
import { ChatMessage } from '../../../core/models/assistant.model';

@Component({
  selector: 'app-chat-widget',
  imports: [FormsModule, FaIconComponent],
  templateUrl: './chat-widget.component.html',
  styleUrl: './chat-widget.component.scss',
})
export class ChatWidgetComponent implements OnDestroy {
  private assistantService = inject(AssistantService);

  faComment = faComment;
  faTimes = faTimes;
  faPaperPlane = faPaperPlane;
  faMinus = faMinus;
  faTrash = faTrash;

  isOpen = signal(false);
  messages = signal<ChatMessage[]>([]);
  inputText = signal('');
  isLoading = signal(false);

  private userScrolledUp = false;
  messagesContainer = viewChild<ElementRef<HTMLDivElement>>('messagesContainer');

  hasMessages = computed(() => this.messages().length > 0);
  canSend = computed(() => this.inputText().trim().length > 0 && !this.isLoading());

  private readonly MAX_MESSAGE_LENGTH = 2000;

  toggle(): void {
    this.isOpen.update((v) => !v);
  }

  minimize(): void {
    this.isOpen.set(false);
  }

  clearChat(): void {
    this.messages.set([]);
    this.assistantService.abort();
    this.isLoading.set(false);
  }

  onScroll(event: Event): void {
    const el = event.target as HTMLElement;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 30;
    this.userScrolledUp = !atBottom;
  }

  async send(): Promise<void> {
    const text = this.inputText().trim();
    if (!text || this.isLoading()) return;

    const truncated = text.substring(0, this.MAX_MESSAGE_LENGTH);

    const userMessage: ChatMessage = {
      role: 'user',
      content: truncated,
      timestamp: new Date(),
    };
    this.messages.update((msgs) => [...msgs, userMessage]);
    this.inputText.set('');
    this.isLoading.set(true);
    this.userScrolledUp = false;
    this.scrollToBottom();

    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };
    this.messages.update((msgs) => [...msgs, assistantMessage]);
    this.scrollToBottom();

    await this.assistantService.sendMessage(truncated, {
      onToken: (token: string) => {
        this.messages.update((msgs) => {
          const updated = [...msgs];
          const last = updated[updated.length - 1];
          updated[updated.length - 1] = {
            ...last,
            content: last.content + token,
          };
          return updated;
        });
        this.scrollToBottom();
      },
      onDone: () => {
        this.messages.update((msgs) => {
          const updated = [...msgs];
          const last = updated[updated.length - 1];
          updated[updated.length - 1] = {
            ...last,
            isStreaming: false,
          };
          return updated;
        });
        this.isLoading.set(false);
        this.scrollToBottom();
      },
      onError: (error: string) => {
        this.messages.update((msgs) => {
          const updated = [...msgs];
          const last = updated[updated.length - 1];
          const hasPartialContent = !!last.content;
          updated[updated.length - 1] = {
            ...last,
            content: hasPartialContent
              ? last.content + '\n\n[' + error + ']'
              : error,
            isStreaming: false,
            isError: true,
          };
          return updated;
        });
        this.isLoading.set(false);
        this.scrollToBottom();
      },
    });
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  ngOnDestroy(): void {
    this.assistantService.abort();
  }

  private scrollToBottom(): void {
    if (this.userScrolledUp) return;
    setTimeout(() => {
      const container = this.messagesContainer()?.nativeElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 0);
  }
}
