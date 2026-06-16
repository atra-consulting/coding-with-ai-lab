import { TestBed } from '@angular/core/testing';
import { ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CronDashboardComponent } from './cron-dashboard.component';
import { CronService } from '../../../core/services/cron.service';
import { CronJob, CronRun, CronRunStatus, CronTrigger, CronJobLastRun } from '../../../core/models/cron.model';
import { Page } from '../../../core/models/page.model';

// ─── Test-data factories ────────────────────────────────────────────────────

const makeLastRun = (): CronJobLastRun => ({
  status: 'SUCCESS',
  startedAt: '2024-06-01T08:00:00.000Z',
  finishedAt: '2024-06-01T08:05:00.000Z',
  durationMs: 300000,
});

const makeJob = (name = 'agent-tasks', enabled = true): CronJob => ({
  name,
  schedule: '0 * * * *',
  description: 'Processes pending agent tasks',
  dispatchEventType: 'agent_task',
  lastRun: makeLastRun(),
  enabled,
});

const makeRun = (
  id = 1,
  overrides: Partial<CronRun> = {},
): CronRun => ({
  id,
  job: 'agent-tasks',
  status: 'SUCCESS',
  trigger: 'CRON',
  startedAt: '2024-06-01T08:00:00.000Z',
  finishedAt: '2024-06-01T08:05:00.000Z',
  durationMs: 300000,
  result: 'Processed 5 tasks',
  githubRunUrl: null,
  error: null,
  ...overrides,
});

const makeRunsPage = (runs: CronRun[], page = 0): Page<CronRun> => ({
  content: runs,
  totalElements: runs.length,
  totalPages: 1,
  size: 20,
  number: page,
  first: true,
  last: true,
});

const EMPTY_PAGE: Page<CronRun> = makeRunsPage([]);

// ─── Helper to set up TestBed with a mocked CronService ─────────────────────

function setupTestBed(mockService: jasmine.SpyObj<CronService>): Promise<void> {
  return TestBed.configureTestingModule({
    imports: [CronDashboardComponent],
    providers: [
      { provide: CronService, useValue: mockService },
    ],
  }).compileComponents();
}

function makeMockService(): jasmine.SpyObj<CronService> {
  return jasmine.createSpyObj<CronService>('CronService', [
    'getJobs',
    'getRuns',
    'triggerNow',
    'setJobEnabled',
  ]);
}

// ─── Lifecycle / data loading ────────────────────────────────────────────────

describe('CronDashboardComponent — ngOnInit', () => {
  let fixture: ComponentFixture<CronDashboardComponent>;
  let component: CronDashboardComponent;
  let mockService: jasmine.SpyObj<CronService>;

  beforeEach(async () => {
    mockService = makeMockService();
    mockService.getJobs.and.returnValue(of([makeJob()]));
    mockService.getRuns.and.returnValue(of(makeRunsPage([makeRun()])));

    await setupTestBed(mockService);

    fixture = TestBed.createComponent(CronDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('calls getJobs() on init', () => {
    expect(mockService.getJobs).toHaveBeenCalledTimes(1);
  });

  it('calls getRuns() on init with page 0 (currentPage 1 → 0-indexed)', () => {
    expect(mockService.getRuns).toHaveBeenCalledWith(0, 20);
  });

  it('currentPage starts at 1', () => {
    expect(component.currentPage).toBe(1);
  });

  it('populates jobs from service response', () => {
    expect(component.jobs.length).toBe(1);
    expect(component.jobs[0].name).toBe('agent-tasks');
  });

  it('populates runsPage from service response', () => {
    expect(component.runsPage).toBeTruthy();
    expect(component.runsPage!.content.length).toBe(1);
  });
});

// ─── Pagination ──────────────────────────────────────────────────────────────

describe('CronDashboardComponent — onPageChange()', () => {
  let fixture: ComponentFixture<CronDashboardComponent>;
  let component: CronDashboardComponent;
  let mockService: jasmine.SpyObj<CronService>;

  beforeEach(async () => {
    mockService = makeMockService();
    mockService.getJobs.and.returnValue(of([makeJob()]));
    mockService.getRuns.and.returnValue(of(makeRunsPage([makeRun()])));

    await setupTestBed(mockService);

    fixture = TestBed.createComponent(CronDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('onPageChange(2) updates currentPage to 2', fakeAsync(() => {
    mockService.getRuns.and.returnValue(of(makeRunsPage([makeRun()], 1)));

    component.onPageChange(2);
    tick();

    expect(component.currentPage).toBe(2);
  }));

  it('onPageChange(2) calls getRuns with page 1 (1-indexed UI → 0-indexed API)', fakeAsync(() => {
    mockService.getRuns.calls.reset();
    mockService.getRuns.and.returnValue(of(makeRunsPage([makeRun()], 1)));

    component.onPageChange(2);
    tick();

    expect(mockService.getRuns).toHaveBeenCalledWith(1, 20);
  }));
});

// ─── runNow() ────────────────────────────────────────────────────────────────

describe('CronDashboardComponent — runNow()', () => {
  let fixture: ComponentFixture<CronDashboardComponent>;
  let component: CronDashboardComponent;
  let mockService: jasmine.SpyObj<CronService>;

  beforeEach(async () => {
    mockService = makeMockService();
    mockService.getJobs.and.returnValue(of([makeJob()]));
    mockService.getRuns.and.returnValue(of(makeRunsPage([makeRun()])));

    await setupTestBed(mockService);

    fixture = TestBed.createComponent(CronDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('sets triggering to true while waiting and false on success', fakeAsync(() => {
    mockService.triggerNow.and.returnValue(of(makeRun(42)));

    component.runNow();
    // triggering is set to true before the observable emits
    // after tick() it resolves synchronously
    tick();

    expect(component.triggering).toBeFalse();
  }));

  it('calls triggerNow() when runNow() is invoked', fakeAsync(() => {
    mockService.triggerNow.and.returnValue(of(makeRun(42)));

    component.runNow();
    tick();

    expect(mockService.triggerNow).toHaveBeenCalledTimes(1);
  }));

  it('sets triggerMessage after successful trigger', fakeAsync(() => {
    const triggeredRun = makeRun(42, { status: 'RUNNING' });
    mockService.triggerNow.and.returnValue(of(triggeredRun));

    component.runNow();
    tick();
    fixture.detectChanges();

    expect(component.triggerMessage).toContain('42');
    expect(component.triggerMessage).toContain('RUNNING');
  }));

  it('reloads jobs after successful trigger', fakeAsync(() => {
    mockService.triggerNow.and.returnValue(of(makeRun(42)));
    mockService.getJobs.calls.reset();
    mockService.getRuns.calls.reset();

    component.runNow();
    tick();

    expect(mockService.getJobs).toHaveBeenCalledTimes(1);
  }));

  it('reloads runs after successful trigger', fakeAsync(() => {
    mockService.triggerNow.and.returnValue(of(makeRun(42)));
    mockService.getJobs.calls.reset();
    mockService.getRuns.calls.reset();

    component.runNow();
    tick();

    expect(mockService.getRuns).toHaveBeenCalled();
  }));

  it('handles triggerNow() error gracefully: sets triggerMessage and clears triggering', fakeAsync(() => {
    mockService.triggerNow.and.returnValue(throwError(() => new Error('Network error')));

    component.runNow();
    tick();

    expect(component.triggering).toBeFalse();
    expect(component.triggerMessage).toContain('Fehler');
  }));
});

// ─── Pure helper methods ──────────────────────────────────────────────────────

describe('CronDashboardComponent — statusBadgeClass()', () => {
  let component: CronDashboardComponent;

  beforeEach(async () => {
    const mockService = makeMockService();
    mockService.getJobs.and.returnValue(of([]));
    mockService.getRuns.and.returnValue(of(EMPTY_PAGE));

    await setupTestBed(mockService);

    const fixture = TestBed.createComponent(CronDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('returns "badge bg-primary" for RUNNING status', () => {
    expect(component.statusBadgeClass('RUNNING' as CronRunStatus)).toBe('badge bg-primary');
  });

  it('returns "badge bg-success" for SUCCESS status', () => {
    expect(component.statusBadgeClass('SUCCESS' as CronRunStatus)).toBe('badge bg-success');
  });

  it('returns "badge bg-danger" for FAILED status', () => {
    expect(component.statusBadgeClass('FAILED' as CronRunStatus)).toBe('badge bg-danger');
  });

  it('returns "badge bg-secondary" for SKIPPED status', () => {
    expect(component.statusBadgeClass('SKIPPED' as CronRunStatus)).toBe('badge bg-secondary');
  });
});

describe('CronDashboardComponent — triggerBadgeClass()', () => {
  let component: CronDashboardComponent;

  beforeEach(async () => {
    const mockService = makeMockService();
    mockService.getJobs.and.returnValue(of([]));
    mockService.getRuns.and.returnValue(of(EMPTY_PAGE));

    await setupTestBed(mockService);

    const fixture = TestBed.createComponent(CronDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('returns "badge bg-light text-dark border" for CRON trigger', () => {
    expect(component.triggerBadgeClass('CRON' as CronTrigger)).toBe('badge bg-light text-dark border');
  });

  it('returns "badge bg-info" for MANUAL trigger', () => {
    expect(component.triggerBadgeClass('MANUAL' as CronTrigger)).toBe('badge bg-info');
  });
});

describe('CronDashboardComponent — formatDuration()', () => {
  let component: CronDashboardComponent;

  beforeEach(async () => {
    const mockService = makeMockService();
    mockService.getJobs.and.returnValue(of([]));
    mockService.getRuns.and.returnValue(of(EMPTY_PAGE));

    await setupTestBed(mockService);

    const fixture = TestBed.createComponent(CronDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('returns "—" for null duration', () => {
    expect(component.formatDuration(null)).toBe('—');
  });

  it('returns milliseconds formatted as "X ms" for values under 1000', () => {
    expect(component.formatDuration(500)).toBe('500 ms');
  });

  it('returns seconds formatted as "X s" for values between 1000 and 60000', () => {
    expect(component.formatDuration(5000)).toBe('5 s');
  });

  it('returns minutes and seconds formatted as "X min Y s" for values >= 60 s', () => {
    expect(component.formatDuration(90000)).toBe('1 min 30 s');
  });
});

// ─── Template rendering ───────────────────────────────────────────────────────

describe('CronDashboardComponent — template rendering with jobs and runs', () => {
  let fixture: ComponentFixture<CronDashboardComponent>;
  let component: CronDashboardComponent;
  let mockService: jasmine.SpyObj<CronService>;

  const job = makeJob('agent-tasks');
  const run = makeRun(7, {
    job: 'agent-tasks',
    status: 'SUCCESS',
    trigger: 'CRON',
    githubRunUrl: 'https://github.com/org/repo/actions/runs/99',
  });

  beforeEach(async () => {
    mockService = makeMockService();
    mockService.getJobs.and.returnValue(of([job]));
    mockService.getRuns.and.returnValue(of(makeRunsPage([run])));

    await setupTestBed(mockService);

    fixture = TestBed.createComponent(CronDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders one job card when one job is returned', () => {
    const cards = fixture.nativeElement.querySelectorAll('.card');
    expect(cards.length).toBeGreaterThanOrEqual(1);
  });

  it('renders the job name in a card header', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('agent-tasks');
  });

  it('renders one run row in the table body', () => {
    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    // One data row plus potentially a message row — must contain at least 1 real row
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });

  it('renders the run job name in the table', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('agent-tasks');
  });

  it('renders an anchor "Run öffnen" when githubRunUrl is set', () => {
    const anchor: HTMLAnchorElement = fixture.nativeElement.querySelector('a[target="_blank"]');
    expect(anchor).toBeTruthy();
    expect(anchor.textContent?.trim()).toBe('Run öffnen');
    expect(anchor.href).toContain('github.com');
  });
});

describe('CronDashboardComponent — template rendering with no githubRunUrl', () => {
  let fixture: ComponentFixture<CronDashboardComponent>;
  let mockService: jasmine.SpyObj<CronService>;

  const runWithoutGhUrl = makeRun(3, { githubRunUrl: null });

  beforeEach(async () => {
    mockService = makeMockService();
    mockService.getJobs.and.returnValue(of([makeJob()]));
    mockService.getRuns.and.returnValue(of(makeRunsPage([runWithoutGhUrl])));

    await setupTestBed(mockService);

    fixture = TestBed.createComponent(CronDashboardComponent);
    fixture.detectChanges();
  });

  it('renders "—" instead of an anchor when githubRunUrl is null', () => {
    const anchor: HTMLAnchorElement | null = fixture.nativeElement.querySelector('a[target="_blank"]');
    expect(anchor).toBeNull();
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('—');
  });
});

describe('CronDashboardComponent — empty states', () => {
  let fixture: ComponentFixture<CronDashboardComponent>;
  let mockService: jasmine.SpyObj<CronService>;

  beforeEach(async () => {
    mockService = makeMockService();
    mockService.getJobs.and.returnValue(of([]));
    mockService.getRuns.and.returnValue(of(EMPTY_PAGE));

    await setupTestBed(mockService);

    fixture = TestBed.createComponent(CronDashboardComponent);
    fixture.detectChanges();
  });

  it('shows "Keine Cron-Jobs konfiguriert." when jobs list is empty', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Keine Cron-Jobs konfiguriert.');
  });

  it('shows "Keine Ausführungen vorhanden." when runs page is empty', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Keine Ausführungen vorhanden.');
  });
});

describe('CronDashboardComponent — triggerMessage alert', () => {
  let fixture: ComponentFixture<CronDashboardComponent>;
  let component: CronDashboardComponent;
  let mockService: jasmine.SpyObj<CronService>;

  beforeEach(async () => {
    mockService = makeMockService();
    mockService.getJobs.and.returnValue(of([makeJob()]));
    mockService.getRuns.and.returnValue(of(makeRunsPage([makeRun()])));

    await setupTestBed(mockService);

    fixture = TestBed.createComponent(CronDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders alert-info when triggerMessage is set', fakeAsync(() => {
    mockService.triggerNow.and.returnValue(of(makeRun(42, { status: 'RUNNING' })));

    component.runNow();
    tick();
    fixture.detectChanges();

    const alert: HTMLElement = fixture.nativeElement.querySelector('.alert-info');
    expect(alert).toBeTruthy();
    expect(alert.textContent).toContain('42');
  }));

  it('does not render the alert-info banner before any trigger is executed', () => {
    const alert: HTMLElement | null = fixture.nativeElement.querySelector('.alert-info');
    expect(alert).toBeNull();
  });
});

// ─── toggleJob() ─────────────────────────────────────────────────────────────

describe('CronDashboardComponent — toggleJob()', () => {
  let fixture: ComponentFixture<CronDashboardComponent>;
  let component: CronDashboardComponent;
  let mockService: jasmine.SpyObj<CronService>;

  beforeEach(async () => {
    mockService = makeMockService();
    mockService.getJobs.and.returnValue(of([makeJob('solve-tasks', true)]));
    mockService.getRuns.and.returnValue(of(EMPTY_PAGE));

    await setupTestBed(mockService);

    fixture = TestBed.createComponent(CronDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('calls setJobEnabled with the job name and the new enabled value', fakeAsync(() => {
    const updatedJob = makeJob('solve-tasks', false);
    mockService.setJobEnabled.and.returnValue(of(updatedJob));

    component.toggleJob(component.jobs[0]);
    tick();

    expect(mockService.setJobEnabled).toHaveBeenCalledWith('solve-tasks', false);
  }));

  it('replaces the job in the jobs array with the DTO returned from the service', fakeAsync(() => {
    const updatedJob = makeJob('solve-tasks', false);
    mockService.setJobEnabled.and.returnValue(of(updatedJob));

    component.toggleJob(component.jobs[0]);
    tick();

    expect(component.jobs[0].enabled).toBeFalse();
  }));

  it('reverts the optimistic flip when the service returns an error', fakeAsync(() => {
    mockService.setJobEnabled.and.returnValue(throwError(() => new Error('Server error')));

    // job starts as enabled=true
    component.toggleJob(component.jobs[0]);
    tick();

    // should have been reverted back to true
    expect(component.jobs[0].enabled).toBeTrue();
  }));

  it('sets a toggleError message on service error', fakeAsync(() => {
    mockService.setJobEnabled.and.returnValue(throwError(() => new Error('Server error')));

    component.toggleJob(component.jobs[0]);
    tick();

    expect(component.toggleErrors['solve-tasks']).toContain('Fehler');
  }));

  it('clears the in-flight flag after successful toggle', fakeAsync(() => {
    const updatedJob = makeJob('solve-tasks', false);
    mockService.setJobEnabled.and.returnValue(of(updatedJob));

    component.toggleJob(component.jobs[0]);
    tick();

    expect(component.togglingJobs['solve-tasks']).toBeFalse();
  }));
});

// ─── Run Now button disabled when solve-tasks is disabled ────────────────────

describe('CronDashboardComponent — Run Now button state', () => {
  let fixture: ComponentFixture<CronDashboardComponent>;
  let component: CronDashboardComponent;
  let mockService: jasmine.SpyObj<CronService>;

  describe('when the solve-tasks job is disabled', () => {
    beforeEach(async () => {
      mockService = makeMockService();
      mockService.getJobs.and.returnValue(of([makeJob('solve-tasks', false)]));
      mockService.getRuns.and.returnValue(of(EMPTY_PAGE));

      await setupTestBed(mockService);

      fixture = TestBed.createComponent(CronDashboardComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('runNowDisabled returns true when solve-tasks is disabled', () => {
      expect(component.runNowDisabled).toBeTrue();
    });

    it('the "Jetzt ausführen" button is disabled in the DOM', () => {
      const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button.btn-primary');
      expect(btn.disabled).toBeTrue();
    });

    it('provides a non-empty title hint on the button', () => {
      const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button.btn-primary');
      expect(btn.title.length).toBeGreaterThan(0);
    });
  });

  describe('when the solve-tasks job is enabled', () => {
    beforeEach(async () => {
      mockService = makeMockService();
      mockService.getJobs.and.returnValue(of([makeJob('solve-tasks', true)]));
      mockService.getRuns.and.returnValue(of(EMPTY_PAGE));

      await setupTestBed(mockService);

      fixture = TestBed.createComponent(CronDashboardComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('runNowDisabled returns false when solve-tasks is enabled', () => {
      expect(component.runNowDisabled).toBeFalse();
    });

    it('the "Jetzt ausführen" button is enabled in the DOM', () => {
      const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button.btn-primary');
      expect(btn.disabled).toBeFalse();
    });
  });

  describe('when there is no solve-tasks job', () => {
    beforeEach(async () => {
      mockService = makeMockService();
      mockService.getJobs.and.returnValue(of([makeJob('other-job', true)]));
      mockService.getRuns.and.returnValue(of(EMPTY_PAGE));

      await setupTestBed(mockService);

      fixture = TestBed.createComponent(CronDashboardComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('runNowDisabled returns false when solve-tasks job does not exist', () => {
      expect(component.runNowDisabled).toBeFalse();
    });
  });
});
