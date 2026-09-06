import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { FeedbackFormComponent } from './feedback-form.component';

// ─── Hardcoded defaults, mirrored from FEEDBACK_CONFIG / DEFAULT_TRAINER_NAMES
// in feedback-form.component.ts — kept here so a change to the component's
// defaults makes these specs fail loudly rather than silently agreeing with
// whatever the component happens to compute.
const DEFAULT_SUBTITLE = 'Agentic Engineering Bootcamp — 03.–04.09.2026';
const DEFAULT_TRAINER_NAMES = 'David Kreutzer, Daniel Wochnik, Benjamin Steimer';
const DEFAULT_TRAINERS = `Trainer: ${DEFAULT_TRAINER_NAMES}`;

function makeRoute(queryParams: Record<string, string>): Partial<ActivatedRoute> {
  return {
    snapshot: {
      queryParamMap: convertToParamMap(queryParams),
    } as ActivatedRoute['snapshot'],
  };
}

async function createFixture(
  queryParams: Record<string, string> = {},
): Promise<ComponentFixture<FeedbackFormComponent>> {
  await TestBed.configureTestingModule({
    imports: [FeedbackFormComponent],
    providers: [{ provide: ActivatedRoute, useValue: makeRoute(queryParams) }],
  }).compileComponents();

  const fixture = TestBed.createComponent(FeedbackFormComponent);
  fixture.detectChanges();
  return fixture;
}

/** Answers all three star questions so submitFeedback() clears the "answer all stars" guard. */
function answerAllStarQuestions(component: FeedbackFormComponent, trainerRating = 4): void {
  component.setRating('gesamteindruck', 5);
  component.setRating('praxisnutzen', 5);
  component.setRating('trainer', trainerRating);
}

describe('FeedbackFormComponent', () => {
  describe('query-param driven config overrides', () => {
    it('overrides config.subtitle and config.trainers from present, non-blank schulung/trainer query params', async () => {
      const fixture = await createFixture({ schulung: 'Test-Training', trainer: 'Anna Muster' });

      expect(fixture.componentInstance.config.subtitle).toBe('Test-Training');
      expect(fixture.componentInstance.config.trainers).toBe('Trainer: Anna Muster');
    });

    it('falls back to the hardcoded defaults when no query params are present', async () => {
      const fixture = await createFixture();

      expect(fixture.componentInstance.config.subtitle).toBe(DEFAULT_SUBTITLE);
      expect(fixture.componentInstance.config.trainers).toBe(DEFAULT_TRAINERS);
    });

    it('falls back to the hardcoded defaults when schulung/trainer query params are blank after trim', async () => {
      const fixture = await createFixture({ schulung: ' ', trainer: '' });

      expect(fixture.componentInstance.config.subtitle).toBe(DEFAULT_SUBTITLE);
      expect(fixture.componentInstance.config.trainers).toBe(DEFAULT_TRAINERS);
    });

    it('overrides only config.subtitle when schulung is present and trainer is absent', async () => {
      const fixture = await createFixture({ schulung: 'Nur-Schulung' });

      expect(fixture.componentInstance.config.subtitle).toBe('Nur-Schulung');
      expect(fixture.componentInstance.config.trainers).toBe(DEFAULT_TRAINERS);
    });
  });

  describe('submitted payload', () => {
    it('includes the overridden schulung and trainerName when query params were present', async () => {
      const fixture = await createFixture({ schulung: 'Test-Training', trainer: 'Anna Muster' });
      const component = fixture.componentInstance;
      const fetchSpy = spyOn(window, 'fetch').and.resolveTo(new Response());
      answerAllStarQuestions(component);

      await component.submitFeedback();

      const body = fetchSpy.calls.mostRecent().args[1]?.body as string;
      const payload = JSON.parse(body);
      expect(payload.schulung).toBe('Test-Training');
      expect(payload.trainerName).toBe('Anna Muster');
    });

    it('includes the hardcoded default schulung and trainerName when query params were absent', async () => {
      const fixture = await createFixture();
      const component = fixture.componentInstance;
      const fetchSpy = spyOn(window, 'fetch').and.resolveTo(new Response());
      answerAllStarQuestions(component);

      await component.submitFeedback();

      const body = fetchSpy.calls.mostRecent().args[1]?.body as string;
      const payload = JSON.parse(body);
      expect(payload.schulung).toBe(DEFAULT_SUBTITLE);
      expect(payload.trainerName).toBe(DEFAULT_TRAINER_NAMES);
    });

    it('keeps payload.trainer as the star rating for the "trainer" question, not the trainer name (regression: payload key collision)', async () => {
      const fixture = await createFixture({ schulung: 'Test-Training', trainer: 'Anna Muster' });
      const component = fixture.componentInstance;
      const fetchSpy = spyOn(window, 'fetch').and.resolveTo(new Response());
      answerAllStarQuestions(component, 3);

      await component.submitFeedback();

      const body = fetchSpy.calls.mostRecent().args[1]?.body as string;
      const payload = JSON.parse(body);
      expect(payload.trainer).toBe(3);
      expect(payload.trainerName).toBe('Anna Muster');
    });
  });
});
