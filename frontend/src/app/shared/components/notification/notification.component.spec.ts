import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NotificationComponent } from './notification.component';
import { NotificationService } from '../../../core/services/notification.service';

describe('NotificationComponent', () => {
  let component: NotificationComponent;
  let fixture: ComponentFixture<NotificationComponent>;
  let notificationService: NotificationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationComponent);
    component = fixture.componentInstance;
    notificationService = TestBed.inject(NotificationService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with no notifications', () => {
    expect(component.notifications.length).toBe(0);
  });

  it('should add notification when service emits', () => {
    notificationService.success('Test Erfolg');
    expect(component.notifications.length).toBe(1);
    expect(component.notifications[0].message).toBe('Test Erfolg');
    expect(component.notifications[0].type).toBe('success');
  });

  it('should add multiple notifications', () => {
    notificationService.success('Erste');
    notificationService.error('Zweite');
    notificationService.warning('Dritte');
    expect(component.notifications.length).toBe(3);
  });

  it('should assign incrementing ids to notifications', () => {
    notificationService.info('First');
    notificationService.info('Second');
    expect(component.notifications[0].id).toBeLessThan(component.notifications[1].id);
  });

  it('should remove notification manually', () => {
    notificationService.success('Test');
    notificationService.error('Error');
    expect(component.notifications.length).toBe(2);

    component.remove(component.notifications[0]);
    expect(component.notifications.length).toBe(1);
    expect(component.notifications[0].type).toBe('error');
  });

  it('should auto-remove notification after 5 seconds', fakeAsync(() => {
    notificationService.success('Auto-remove Test');
    expect(component.notifications.length).toBe(1);

    tick(5000);
    expect(component.notifications.length).toBe(0);
  }));

  it('should unsubscribe on destroy', () => {
    notificationService.success('Before destroy');
    expect(component.notifications.length).toBe(1);

    component.ngOnDestroy();

    // After destroy, new notifications should not be added
    notificationService.success('After destroy');
    expect(component.notifications.length).toBe(1);
  });
});
