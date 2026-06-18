import { TestBed } from '@angular/core/testing';
import { Notification, NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should emit success notification', (done) => {
    service.notifications$.subscribe((notification: Notification) => {
      expect(notification.type).toBe('success');
      expect(notification.message).toBe('Erfolgreich gespeichert');
      done();
    });
    service.success('Erfolgreich gespeichert');
  });

  it('should emit error notification', (done) => {
    service.notifications$.subscribe((notification: Notification) => {
      expect(notification.type).toBe('error');
      expect(notification.message).toBe('Ein Fehler ist aufgetreten');
      done();
    });
    service.error('Ein Fehler ist aufgetreten');
  });

  it('should emit info notification', (done) => {
    service.notifications$.subscribe((notification: Notification) => {
      expect(notification.type).toBe('info');
      expect(notification.message).toBe('Hinweis');
      done();
    });
    service.info('Hinweis');
  });

  it('should emit warning notification', (done) => {
    service.notifications$.subscribe((notification: Notification) => {
      expect(notification.type).toBe('warning');
      expect(notification.message).toBe('Achtung');
      done();
    });
    service.warning('Achtung');
  });

  it('should emit multiple notifications in sequence', () => {
    const received: Notification[] = [];
    service.notifications$.subscribe((n) => received.push(n));

    service.success('first');
    service.error('second');
    service.info('third');

    expect(received.length).toBe(3);
    expect(received[0].type).toBe('success');
    expect(received[1].type).toBe('error');
    expect(received[2].type).toBe('info');
  });
});
