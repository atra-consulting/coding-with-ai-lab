import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AgentTaskDetailComponent } from './agent-task-detail.component';
import { AgentTaskService } from '../../../core/services/agent-task.service';
import { AgentTask } from '../../../core/models/agent-task.model';

const MOCK_TASK: AgentTask = {
  id: 7,
  source: 'GITHUB_ISSUE',
  title: 'Show total pipeline value on Chancen board',
  body: 'The pipeline board does not show a total value. Please add it to the header.',
  status: 'DONE',
  comment: 'Implemented pipeline total in Chancen board header.',
  metadata: '{"issueNumber":42,"repo":"crm"}',
  pickedUpAt: '2024-01-02T08:00:00.000Z',
  resolvedAt: '2024-01-02T12:00:00.000Z',
  createdAt: '2024-01-01T10:00:00.000Z',
  updatedAt: '2024-01-02T12:00:00.000Z',
};

function makeRoute(id: string): Partial<ActivatedRoute> {
  return {
    snapshot: {
      paramMap: convertToParamMap({ id }),
    } as ActivatedRoute['snapshot'],
  };
}

describe('AgentTaskDetailComponent', () => {
  let fixture: ComponentFixture<AgentTaskDetailComponent>;
  let component: AgentTaskDetailComponent;
  let mockService: jasmine.SpyObj<AgentTaskService>;

  beforeEach(async () => {
    mockService = jasmine.createSpyObj<AgentTaskService>('AgentTaskService', [
      'getAll',
      'getById',
      'getSummary',
      'resetAll',
    ]);
    mockService.getById.and.returnValue(of(MOCK_TASK));

    await TestBed.configureTestingModule({
      imports: [AgentTaskDetailComponent],
      providers: [
        provideRouter([]),
        { provide: AgentTaskService, useValue: mockService },
        { provide: ActivatedRoute, useValue: makeRoute('7') },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AgentTaskDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('calls getById() with the numeric id from route snapshot', () => {
    expect(mockService.getById).toHaveBeenCalledWith(7);
  });

  it('renders the task id in the page header', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Agent-Aufgabe #7');
  });

  it('renders the source field', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('GITHUB_ISSUE');
  });

  it('renders the title field', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Show total pipeline value on Chancen board');
  });

  it('renders the body text in a <pre> element', () => {
    const pre: HTMLElement = fixture.nativeElement.querySelector('pre');
    expect(pre).toBeTruthy();
    expect(pre.textContent).toContain('The pipeline board does not show a total value');
  });

  it('renders the comment field', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Implemented pipeline total in Chancen board header.');
  });

  it('renders the createdAt date', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('2024-01-01T10:00:00.000Z');
  });

  it('renders pickedUpAt when present', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('2024-01-02T08:00:00.000Z');
  });

  it('renders resolvedAt when present', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('2024-01-02T12:00:00.000Z');
  });

  it('renders metadata in a second <pre> element when metadata is present', () => {
    const pres = fixture.nativeElement.querySelectorAll('pre');
    expect(pres.length).toBeGreaterThanOrEqual(2);
    const metaPre: HTMLElement = pres[1];
    expect(metaPre.textContent).toContain('"issueNumber"');
  });

  it('renders "—" for null comment when task has no comment', async () => {
    const taskNoComment: AgentTask = { ...MOCK_TASK, comment: null };
    mockService.getById.and.returnValue(of(taskNoComment));

    const fixture2 = TestBed.createComponent(AgentTaskDetailComponent);
    fixture2.detectChanges();

    const text: string = fixture2.nativeElement.textContent;
    expect(text).toContain('—');
  });

  it('shows error message when getById() fails', async () => {
    mockService.getById.and.returnValue(throwError(() => new Error('Not found')));

    const fixture3 = TestBed.createComponent(AgentTaskDetailComponent);
    fixture3.detectChanges();

    const alert: HTMLElement = fixture3.nativeElement.querySelector('.alert-danger');
    expect(alert).toBeTruthy();
    expect(alert.textContent).toContain('Aufgabe nicht gefunden');
  });
});

describe('AgentTaskDetailComponent — statusBadgeClass()', () => {
  let component: AgentTaskDetailComponent;

  beforeEach(async () => {
    const mockService = jasmine.createSpyObj<AgentTaskService>('AgentTaskService', ['getById']);
    mockService.getById.and.returnValue(of(MOCK_TASK));

    await TestBed.configureTestingModule({
      imports: [AgentTaskDetailComponent],
      providers: [
        provideRouter([]),
        { provide: AgentTaskService, useValue: mockService },
        { provide: ActivatedRoute, useValue: makeRoute('7') },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AgentTaskDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('returns "badge bg-info" for OPEN', () => {
    expect(component.statusBadgeClass('OPEN')).toBe('badge bg-info');
  });

  it('returns "badge bg-warning text-dark" for IN_PROGRESS', () => {
    expect(component.statusBadgeClass('IN_PROGRESS')).toBe('badge bg-warning text-dark');
  });

  it('returns "badge bg-success" for DONE', () => {
    expect(component.statusBadgeClass('DONE')).toBe('badge bg-success');
  });

  it('returns "badge bg-danger" for REJECTED', () => {
    expect(component.statusBadgeClass('REJECTED')).toBe('badge bg-danger');
  });
});
