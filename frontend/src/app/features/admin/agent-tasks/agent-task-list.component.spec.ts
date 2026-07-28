import { TestBed } from '@angular/core/testing';
import { ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { AgentTaskListComponent } from './agent-task-list.component';
import { AgentTaskService } from '../../../core/services/agent-task.service';
import { AgentTask } from '../../../core/models/agent-task.model';
import { Page } from '../../../core/models/page.model';

const makeTask = (id: number, source: AgentTask['source'] = 'EMAIL'): AgentTask => ({
  id,
  source,
  title: `Task ${id}`,
  body: `Body of task ${id}`,
  status: 'OPEN',
  comment: null,
  metadata: null,
  pickedUpAt: null,
  resolvedAt: null,
  createdAt: '2024-01-01T10:00:00.000Z',
  updatedAt: '2024-01-01T10:00:00.000Z',
});

const makePage = (tasks: AgentTask[], page = 0): Page<AgentTask> => ({
  content: tasks,
  totalElements: tasks.length,
  totalPages: 1,
  size: 20,
  number: page,
  first: true,
  last: true,
});

function makeRoute(queryParams: Record<string, string> = {}): Partial<ActivatedRoute> {
  return { queryParams: of(queryParams) };
}

describe('AgentTaskListComponent', () => {
  let fixture: ComponentFixture<AgentTaskListComponent>;
  let component: AgentTaskListComponent;
  let mockService: jasmine.SpyObj<AgentTaskService>;

  const emailTasks = [makeTask(1, 'EMAIL'), makeTask(2, 'EMAIL')];

  beforeEach(async () => {
    mockService = jasmine.createSpyObj<AgentTaskService>('AgentTaskService', [
      'getAll',
      'getById',
      'getSummary',
      'resetAll',
    ]);
    mockService.getAll.and.returnValue(of(makePage(emailTasks)));

    await TestBed.configureTestingModule({
      imports: [AgentTaskListComponent],
      providers: [
        provideRouter([]),
        { provide: AgentTaskService, useValue: mockService },
        { provide: ActivatedRoute, useValue: makeRoute({ source: 'EMAIL' }) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AgentTaskListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('calls getAll() with currentPage-1 (0-indexed) on init', () => {
    expect(mockService.getAll).toHaveBeenCalledWith(0, 20, 'createdAt,desc', 'EMAIL');
  });

  it('reads source from queryParams and sets activeSource', () => {
    expect(component.activeSource).toBe('EMAIL');
  });

  it('passes currentPage-1 to service (1-indexed UI → 0-indexed API)', () => {
    expect(component.currentPage).toBe(1);
    const firstCall = mockService.getAll.calls.mostRecent();
    expect(firstCall.args[0]).toBe(0);
  });

  it('renders a table row for each task returned by service', () => {
    const rows = fixture.nativeElement.querySelectorAll('tbody tr.cursor-pointer');
    expect(rows.length).toBe(2);
  });

  it('renders the task title in the table', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Task 1');
    expect(text).toContain('Task 2');
  });

  it('renders task id in the table', () => {
    const firstRow: HTMLElement = fixture.nativeElement.querySelector('tbody tr.cursor-pointer');
    expect(firstRow.textContent).toContain('1');
  });

  it('renders "—" for null pickedUpAt timestamps', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('—');
  });

  it('onPageChange() updates currentPage and reloads tasks', fakeAsync(() => {
    mockService.getAll.calls.reset();
    mockService.getAll.and.returnValue(of(makePage(emailTasks, 1)));

    component.onPageChange(2);
    tick();

    expect(component.currentPage).toBe(2);
    expect(mockService.getAll).toHaveBeenCalledWith(1, 20, 'createdAt,desc', 'EMAIL');
  }));

  it('renders "Keine Aufgaben vorhanden." when page content is empty', fakeAsync(async () => {
    mockService.getAll.and.returnValue(of(makePage([])));

    component.loadTasks();
    tick();
    fixture.detectChanges();

    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Keine Aufgaben vorhanden.');
  }));
});

describe('AgentTaskListComponent — no source queryParam', () => {
  let fixture: ComponentFixture<AgentTaskListComponent>;
  let component: AgentTaskListComponent;
  let mockService: jasmine.SpyObj<AgentTaskService>;

  beforeEach(async () => {
    mockService = jasmine.createSpyObj<AgentTaskService>('AgentTaskService', [
      'getAll',
      'getById',
      'getSummary',
      'resetAll',
    ]);
    mockService.getAll.and.returnValue(of(makePage([])));

    await TestBed.configureTestingModule({
      imports: [AgentTaskListComponent],
      providers: [
        provideRouter([]),
        { provide: AgentTaskService, useValue: mockService },
        { provide: ActivatedRoute, useValue: makeRoute() },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AgentTaskListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('calls getAll() without source param when queryParam is absent', () => {
    expect(mockService.getAll).toHaveBeenCalledWith(0, 20, 'createdAt,desc', undefined);
  });

  it('activeSource is null when no source queryParam', () => {
    expect(component.activeSource).toBeNull();
  });
});

describe('AgentTaskListComponent — statusBadgeClass()', () => {
  let component: AgentTaskListComponent;

  beforeEach(async () => {
    const mockService = jasmine.createSpyObj<AgentTaskService>('AgentTaskService', ['getAll']);
    mockService.getAll.and.returnValue(of(makePage([])));

    await TestBed.configureTestingModule({
      imports: [AgentTaskListComponent],
      providers: [
        provideRouter([]),
        { provide: AgentTaskService, useValue: mockService },
        { provide: ActivatedRoute, useValue: makeRoute() },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AgentTaskListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('returns "badge bg-info" for OPEN status', () => {
    expect(component.statusBadgeClass('OPEN')).toBe('badge bg-info');
  });

  it('returns "badge bg-warning text-dark" for IN_PROGRESS status', () => {
    expect(component.statusBadgeClass('IN_PROGRESS')).toBe('badge bg-warning text-dark');
  });

  it('returns "badge bg-success" for DONE status', () => {
    expect(component.statusBadgeClass('DONE')).toBe('badge bg-success');
  });

  it('returns "badge bg-danger" for REJECTED status', () => {
    expect(component.statusBadgeClass('REJECTED')).toBe('badge bg-danger');
  });

  it('returns "badge bg-secondary" for unknown status', () => {
    expect(component.statusBadgeClass('UNKNOWN')).toBe('badge bg-secondary');
  });
});
