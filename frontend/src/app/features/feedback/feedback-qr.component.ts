import { Component, OnInit, signal, ElementRef, viewChild } from '@angular/core';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-feedback-qr',
  templateUrl: './feedback-qr.component.html',
  styleUrl: './feedback-qr.component.scss',
})
export class FeedbackQrComponent implements OnInit {
  private canvas = viewChild<ElementRef<HTMLCanvasElement>>('qrCanvas');
  feedbackUrl = signal('');

  ngOnInit(): void {
    const baseUrl = window.location.origin;
    this.feedbackUrl.set(`${baseUrl}/feedback`);
  }

  ngAfterViewInit(): void {
    this.generateQR();
  }

  private generateQR(): void {
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
