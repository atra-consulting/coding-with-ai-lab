import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmDialogComponent } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  let component: ConfirmDialogComponent;
  let fixture: ComponentFixture<ConfirmDialogComponent>;
  let modalSpy: jasmine.SpyObj<NgbActiveModal>;

  beforeEach(async () => {
    modalSpy = jasmine.createSpyObj('NgbActiveModal', ['close', 'dismiss']);

    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
      providers: [{ provide: NgbActiveModal, useValue: modalSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default title', () => {
    expect(component.title).toBe('Bestätigung');
  });

  it('should have default message', () => {
    expect(component.message).toBe('Sind Sie sicher?');
  });

  it('should have default confirm text', () => {
    expect(component.confirmText).toBe('Löschen');
  });

  it('should allow custom title, message, and confirmText', () => {
    component.title = 'Warnung';
    component.message = 'Wollen Sie fortfahren?';
    component.confirmText = 'Ja, fortfahren';
    fixture.detectChanges();

    expect(component.title).toBe('Warnung');
    expect(component.message).toBe('Wollen Sie fortfahren?');
    expect(component.confirmText).toBe('Ja, fortfahren');
  });

  it('should render title in the template', () => {
    component.title = 'Test Titel';
    fixture.detectChanges();
    const titleEl = fixture.nativeElement.querySelector('.modal-title');
    expect(titleEl.textContent).toContain('Test Titel');
  });

  it('should render message in the template', () => {
    component.message = 'Test Nachricht';
    fixture.detectChanges();
    const bodyEl = fixture.nativeElement.querySelector('.modal-body p');
    expect(bodyEl.textContent).toContain('Test Nachricht');
  });

  it('should close modal with true on confirm click', () => {
    const confirmBtn = fixture.nativeElement.querySelector('.btn-danger');
    confirmBtn.click();
    expect(modalSpy.close).toHaveBeenCalledWith(true);
  });

  it('should dismiss modal on cancel click', () => {
    const cancelBtn = fixture.nativeElement.querySelector('.btn-secondary');
    cancelBtn.click();
    expect(modalSpy.dismiss).toHaveBeenCalled();
  });
});
