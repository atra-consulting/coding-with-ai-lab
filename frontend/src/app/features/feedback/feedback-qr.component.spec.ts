import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeedbackQrComponent } from './feedback-qr.component';

describe('FeedbackQrComponent', () => {
  let fixture: ComponentFixture<FeedbackQrComponent>;
  let component: FeedbackQrComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeedbackQrComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FeedbackQrComponent);
    component = fixture.componentInstance;
  });

  // ─── buildFeedbackUrl() — pure, no DOM/fixture interaction ────────────────

  describe('buildFeedbackUrl()', () => {
    it('returns the bare feedback URL (no "?") when both schulung and trainer are empty', () => {
      const url = component.buildFeedbackUrl('https://example.com', '', '');

      expect(url).toBe('https://example.com/feedback');
    });

    it('includes only the schulung param when trainer is empty', () => {
      const url = component.buildFeedbackUrl('https://example.com', 'Bootcamp', '');

      expect(url).toBe('https://example.com/feedback?schulung=Bootcamp');
    });

    it('includes only the trainer param when schulung is empty', () => {
      const url = component.buildFeedbackUrl('https://example.com', '', 'Anna Muster');

      expect(url).toBe('https://example.com/feedback?trainer=Anna%20Muster');
    });

    it('includes both params, schulung first then trainer, when both are set', () => {
      const url = component.buildFeedbackUrl('https://example.com', 'Bootcamp', 'Anna Muster');

      expect(url).toBe('https://example.com/feedback?schulung=Bootcamp&trainer=Anna%20Muster');
    });

    it('encodeURIComponent-encodes special characters in schulung', () => {
      const url = component.buildFeedbackUrl('https://example.com', 'A&B üö', '');

      expect(url).toBe(`https://example.com/feedback?schulung=${encodeURIComponent('A&B üö')}`);
    });

    it('truncates schulung to 200 chars after trimming', () => {
      const url = component.buildFeedbackUrl('https://example.com', 'x'.repeat(250), '');

      const match = url.match(/schulung=([^&]+)/);
      expect(match).not.toBeNull();
      const decoded = decodeURIComponent(match![1]);
      expect(decoded).toBe('x'.repeat(200));
    });

    it('trims leading/trailing whitespace from schulung before encoding', () => {
      const url = component.buildFeedbackUrl('https://example.com', '  Padded  ', '');

      const match = url.match(/schulung=([^&]+)/);
      expect(match).not.toBeNull();
      const decoded = decodeURIComponent(match![1]);
      expect(decoded).toBe('Padded');
    });
  });

  // ─── DOM / fixture interaction ─────────────────────────────────────────────

  describe('onInputChange()', () => {
    it('recomputes feedbackUrl() from the current schulungInput/trainerInput via buildFeedbackUrl()', () => {
      component.schulungInput = 'Test';

      component.onInputChange();

      expect(component.feedbackUrl()).toBe(
        component.buildFeedbackUrl('https://atra-feedback.vercel.app', 'Test', ''),
      );
    });

    it('updates feedbackUrl() when typing into the real #schulung-input element (proves [(ngModel)] + (ngModelChange) wiring, not just the direct method call)', () => {
      fixture.detectChanges();

      const input: HTMLInputElement = fixture.nativeElement.querySelector('#schulung-input');
      input.value = 'Test';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(component.feedbackUrl()).toBe(
        component.buildFeedbackUrl('https://atra-feedback.vercel.app', 'Test', ''),
      );
    });
  });

  describe('DOM: input labels', () => {
    it('renders a label[for="schulung-input"] matching an input#schulung-input', () => {
      fixture.detectChanges();

      const label: HTMLLabelElement = fixture.nativeElement.querySelector(
        'label[for="schulung-input"]',
      );
      const input: HTMLInputElement = fixture.nativeElement.querySelector('#schulung-input');

      expect(label).not.toBeNull();
      expect(input).not.toBeNull();
    });

    it('renders a label[for="trainer-input"] matching an input#trainer-input', () => {
      fixture.detectChanges();

      const label: HTMLLabelElement = fixture.nativeElement.querySelector(
        'label[for="trainer-input"]',
      );
      const input: HTMLInputElement = fixture.nativeElement.querySelector('#trainer-input');

      expect(label).not.toBeNull();
      expect(input).not.toBeNull();
    });
  });

  describe('initial load', () => {
    it('feedbackUrl() is the bare deployed feedback URL with no query string before any input', () => {
      fixture.detectChanges();

      expect(component.feedbackUrl()).toBe('https://atra-feedback.vercel.app/feedback');
    });

    it('never points at the local origin, even when served from localhost', () => {
      fixture.detectChanges();

      expect(component.feedbackUrl().startsWith('https://atra-feedback.vercel.app/')).toBeTrue();
    });
  });
});
