import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Notification {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notificationSubject = new Subject<Notification>();
  notifications$ = this.notificationSubject.asObservable();

  success(message: string): void {
    this.notificationSubject.next({ type: 'success', message });
  }

  error(message: string): void {
    this.notificationSubject.next({ type: 'error', message });
  }

  info(message: string): void {
    this.notificationSubject.next({ type: 'info', message });
  }

  warning(message: string): void {
    this.notificationSubject.next({ type: 'warning', message });
  }
}
