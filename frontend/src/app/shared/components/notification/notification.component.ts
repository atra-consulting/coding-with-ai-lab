import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Notification, NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification',
  imports: [],
  template: `
    <div class="notification-container">
      @for (notification of notifications; track notification) {
        <div
          class="alert alert-{{
            notification.type === 'error' ? 'danger' : notification.type
          }} alert-dismissible fade show"
          role="alert"
        >
          {{ notification.message }}
          <button type="button" class="btn-close" (click)="remove(notification)"></button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .notification-container {
        position: fixed;
        top: 70px;
        right: 20px;
        z-index: 1050;
        max-width: 400px;
      }
    `,
  ],
})
export class NotificationComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private subscription!: Subscription;
  notifications: (Notification & { id: number })[] = [];
  private counter = 0;

  ngOnInit(): void {
    this.subscription = this.notificationService.notifications$.subscribe((notification) => {
      const n = { ...notification, id: this.counter++ };
      this.notifications.push(n);
      setTimeout(() => this.remove(n), 5000);
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  remove(notification: Notification & { id: number }): void {
    this.notifications = this.notifications.filter((n) => n.id !== notification.id);
  }
}
