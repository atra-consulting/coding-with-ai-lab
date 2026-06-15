import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoadingSpinnerComponent } from './loading-spinner.component';

describe('LoadingSpinnerComponent', () => {
  let component: LoadingSpinnerComponent;
  let fixture: ComponentFixture<LoadingSpinnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingSpinnerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingSpinnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render a spinner element', () => {
    const spinner = fixture.nativeElement.querySelector('.spinner-border');
    expect(spinner).toBeTruthy();
  });

  it('should have accessible status role', () => {
    const spinner = fixture.nativeElement.querySelector('[role="status"]');
    expect(spinner).toBeTruthy();
  });

  it('should have visually hidden loading text for screen readers', () => {
    const hiddenText = fixture.nativeElement.querySelector('.visually-hidden');
    expect(hiddenText).toBeTruthy();
    expect(hiddenText.textContent).toContain('Laden');
  });
});
