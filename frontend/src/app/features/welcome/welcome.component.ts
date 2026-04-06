import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-welcome',
  imports: [RouterLink],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.scss',
})
export class WelcomeComponent implements OnInit, OnDestroy {
  private targetDate = new Date('2026-04-06T00:00:00');
  private intervalId: ReturnType<typeof setInterval> | null = null;

  days = signal(0);
  hours = signal(0);
  minutes = signal(0);
  seconds = signal(0);
  countdownFinished = signal(false);

  ngOnInit(): void {
    this.updateCountdown();
    this.intervalId = setInterval(() => this.updateCountdown(), 1000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private updateCountdown(): void {
    const now = new Date().getTime();
    const diff = this.targetDate.getTime() - now;

    if (diff <= 0) {
      this.countdownFinished.set(true);
      this.days.set(0);
      this.hours.set(0);
      this.minutes.set(0);
      this.seconds.set(0);
      if (this.intervalId) {
        clearInterval(this.intervalId);
      }
      return;
    }

    this.days.set(Math.floor(diff / (1000 * 60 * 60 * 24)));
    this.hours.set(Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
    this.minutes.set(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));
    this.seconds.set(Math.floor((diff % (1000 * 60)) / 1000));
  }
}
