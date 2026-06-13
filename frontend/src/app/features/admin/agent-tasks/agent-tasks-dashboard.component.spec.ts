import { TestBed } from '@angular/core/testing';
import { ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { AgentTasksDashboardComponent } from './agent-tasks-dashboard.component';
import { AgentTaskService } from '../../../core/services/agent-task.service';
import { AgentTaskSummary } from '../../../core/models/agent-task.model';

const MOCK_SUMMARIES: AgentTaskSummary[] = [
  { source: 'EMAIL', openCount: 4, inProgressCount: 1, doneCount: 2, rejectedCount: 1 },
  { source: 'GITHUB_ISSUE', openCount: 3, inProgressCount: 0, doneCount: 1, rejectedCount: 0 },
  { source: 'APP_LOG', openCount: 2, inProgressCount: 0, doneCount: 1, rejectedCount: 1 },
  { source: 'ERROR_REPORT', openCount: 1, inProgressCount: 0, doneCount: 2, rejectedCount: 2 },
];

function makeMockService(): jasmine.SpyObj<AgentTaskService> {
  return jasmine.createSpyObj<AgentTaskService>('AgentTaskService', [
    'getSummary',
    'getAll',
    'getById',
    'resetAll',
  ]);
}

function makeRoute(queryParams: Record<string, string> = {}): Partial<ActivatedRoute> {
  return { queryParams: of(queryParams) };
}

describe('AgentTasksDashboardComponent — no source (summary view)', () => {
  let fixture: ComponentFixture<AgentTasksDashboardComponent>;
  let component: AgentTasksDashboardComponent;
  let mockService: jasmine.SpyObj<AgentTaskService>;

  beforeEach(async () => {
    mockService = makeMockService();
    mockService.getSummary.and.returnValue(of(MOCK_SUMMARIES));

    await TestBed.configureTestingModule({
      imports: [AgentTasksDashboardComponent],
      providers: [
        provideRouter([]),
        { provide: AgentTaskService, useValue: mockService },
        { provide: ActivatedRoute, useValue: makeRoute() },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AgentTasksDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('calls getSummary() on init when no source queryParam is present', () => {
    expect(mockService.getSummary).toHaveBeenCalledTimes(1);
  });

  it('renders four summary cards (one per source)', () => {
    const cards = fixture.nativeElement.querySelectorAll('.card');
    expect(cards.length).toBe(4);
  });

  it('renders the EMAIL card label "Customer Emails"', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Customer Emails');
  });

  it('renders all four source labels', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Customer Emails');
    expect(text).toContain('GitHub Issues');
    expect(text).toContain('Application Logs');
    expect(text).toContain('Error Reports');
  });

  it('displays openCount from mock summary in EMAIL card', () => {
    const cards = fixture.nativeElement.querySelectorAll('.card');
    const emailCard: HTMLElement = cards[0];
    expect(emailCard.textContent).toContain('4');
  });

  it('displays inProgressCount from mock summary', () => {
    const cards = fixture.nativeElement.querySelectorAll('.card');
    const emailCard: HTMLElement = cards[0];
    expect(emailCard.textContent).toContain('1');
  });

  it('renders the reset button "Alle Aufgaben zurücksetzen"', () => {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button.btn-outline-danger');
    expect(button).toBeTruthy();
    expect(button.textContent?.trim()).toContain('Alle Aufgaben zurücksetzen');
  });

  it('resetAllTasks() calls resetAll() and reloads summary when window.confirm returns true', fakeAsync(() => {
    mockService.resetAll.and.returnValue(of({ reset: 16 }));
    mockService.getSummary.calls.reset();
    spyOn(window, 'confirm').and.returnValue(true);

    component.resetAllTasks();
    tick();

    expect(mockService.resetAll).toHaveBeenCalledTimes(1);
    expect(mockService.getSummary).toHaveBeenCalledTimes(1);
  }));

  it('resetAllTasks() does NOT call resetAll() when window.confirm returns false', fakeAsync(() => {
    spyOn(window, 'confirm').and.returnValue(false);

    component.resetAllTasks();
    tick();

    expect(mockService.resetAll).not.toHaveBeenCalled();
  }));
});

describe('AgentTasksDashboardComponent — with source queryParam (list view)', () => {
  let fixture: ComponentFixture<AgentTasksDashboardComponent>;
  let component: AgentTasksDashboardComponent;
  let mockService: jasmine.SpyObj<AgentTaskService>;

  beforeEach(async () => {
    mockService = makeMockService();
    // getSummary is NOT called when activeSource is set (loadSummary only runs when
    // no source param is present), but wire it up defensively to avoid test errors
    mockService.getSummary.and.returnValue(of(MOCK_SUMMARIES));
    mockService.getAll.and.returnValue(
      of({
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 20,
        number: 0,
        first: true,
        last: true,
      }),
    );

    await TestBed.configureTestingModule({
      imports: [AgentTasksDashboardComponent],
      providers: [
        provideRouter([]),
        { provide: AgentTaskService, useValue: mockService },
        { provide: ActivatedRoute, useValue: makeRoute({ source: 'EMAIL' }) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AgentTasksDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('sets activeSource to EMAIL from queryParam', () => {
    expect(component.activeSource).toBe('EMAIL');
  });

  it('renders the <app-agent-task-list> child component instead of the cards', () => {
    const listEl = fixture.nativeElement.querySelector('app-agent-task-list');
    expect(listEl).toBeTruthy();
  });

  it('does NOT render the four summary cards when source is set', () => {
    const cards = fixture.nativeElement.querySelectorAll('.card');
    expect(cards.length).toBe(0);
  });
});
