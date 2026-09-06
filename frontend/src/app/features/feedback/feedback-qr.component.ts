import { Component, OnInit, signal, ElementRef, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-feedback-qr',
  templateUrl: './feedback-qr.component.html',
  styleUrl: './feedback-qr.component.scss',
  imports: [FormsModule],
})
export class FeedbackQrComponent implements OnInit {
  private canvas = viewChild<ElementRef<HTMLCanvasElement>>('qrCanvas');
  feedbackUrl = signal('');
  schulungInput = '';
  trainerInput = '';

  ngOnInit(): void {
    const baseUrl = window.location.origin;
    this.feedbackUrl.set(this.buildFeedbackUrl(baseUrl, this.schulungInput, this.trainerInput));
  }

  ngAfterViewInit(): void {
    this.generateQR();
  }

  buildFeedbackUrl(baseUrl: string, schulung: string, trainer: string): string {
    const schulungTrimmed = schulung.trim().slice(0, 200);
    const trainerTrimmed = trainer.trim().slice(0, 200);

    const params: string[] = [];
    if (schulungTrimmed.length > 0) {
      params.push(`schulung=${encodeURIComponent(schulungTrimmed)}`);
    }
    if (trainerTrimmed.length > 0) {
      params.push(`trainer=${encodeURIComponent(trainerTrimmed)}`);
    }

    if (params.length === 0) {
      return `${baseUrl}/feedback`;
    }
    return `${baseUrl}/feedback?${params.join('&')}`;
  }

  onInputChange(): void {
    this.feedbackUrl.set(
      this.buildFeedbackUrl(window.location.origin, this.schulungInput, this.trainerInput),
    );
    this.generateQR();
  }

  public generateQR(): void {
    const canvasEl = this.canvas()?.nativeElement;
    if (!canvasEl) return;

    QRCode.toCanvas(canvasEl, this.feedbackUrl(), {
      width: 280,
      margin: 2,
      color: {
        dark: '#264892',
        light: '#ffffff',
      },
    });
  }
}
