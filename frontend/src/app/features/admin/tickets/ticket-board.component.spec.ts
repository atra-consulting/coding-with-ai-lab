import { TestBed } from '@angular/core/testing';
import { ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { TicketBoardComponent } from './ticket-board.component';
import { TicketService } from '../../../core/services/ticket.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Ticket, TicketBoard, TicketSummary } from '../../../core/models/ticket.model';

// ─── Test-data factories ──────────────────────────────────────────────────────
// Create fresh objects on every call to avoid shared-reference mutations between tests.

function makeTicket(id: number, overrides: Partial<Ticket> = {}): Ticket {
  return {
    id,
    owner: 'AI',
    type: 'FEATURE',
    title: `Ticket ${id}`,
    body: `Body of ticket ${id}`,
    status: 'TODO',
    solution: null,
    commentCount: 0,
    comments: [],
    pickedUpAt: null,
    resolvedAt: null,
    createdAt: '2024-06-01T07:00:00.000Z',
    updatedAt: '2024-06-01T07:00:00.000Z',
    ...overrides,
  };
}

// Board factory — always returns fresh arrays to prevent cross-test mutation.
function makeMockBoard(): TicketBoard {
  return {
    TODO: [makeTicket(1), makeTicket(2)],
    IN_PROGRESS: [makeTicket(3, { status: 'IN_PROGRESS' })],
    ON_HOLD: [makeTicket(4, { status: 'ON_HOLD', owner: 'HUMAN' })],
    DONE: [makeTicket(5, { status: 'DONE', solution: 'DONE' })],
  };
}

const MOCK_SUMMARY: TicketSummary = {
  byStatus: { TODO: 2, IN_PROGRESS: 1, ON_HOLD: 1, DONE: 1 },
  byType: { FEATURE: 5, BUG: 0, CHORE: 0 },
  byOwner: { AI: 4, HUMAN: 1 },
  bySolution: { DONE: 1, WONT_DO: 0 },
};

// ─── TestBed helpers ─────────────────────────────────────────────────────────

function makeMockTicketService(): jasmine.SpyObj<TicketService> {
  return jasmine.createSpyObj<TicketService>('TicketService', [
    'getBoard',
    'getSummary',
    'getById',
    'getAll',
    'create',
    'setStatus',
    'setOwner',
    'wontDo',
    'addComment',
  ]);
}

function makeMockNotification(): jasmine.SpyObj<NotificationService> {
  return jasmine.createSpyObj<NotificationService>('NotificationService', [
    'success',
    'error',
    'info',
    'warning',
  ]);
}

// A minimal NgbModal stub: open() returns a promise-like result
function makeModalStub(resolveResult: unknown = undefined): Partial<NgbModal> {
  return {
    open: jasmine.createSpy('open').and.returnValue({
      componentInstance: {},
      result: Promise.resolve(resolveResult),
    }),
  };
}

async function setupTestBed(
  mockService: jasmine.SpyObj<TicketService>,
  notif?: jasmine.SpyObj<NotificationService>,
): Promise<void> {
  await TestBed.configureTestingModule({
    imports: [TicketBoardComponent],
    providers: [
      provideRouter([]),
      { provide: TicketService, useValue: mockService },
      { provide: NotificationService, useValue: notif ?? makeMockNotification() },
      { provide: NgbModal, useValue: makeModalStub() },
    ],
  }).compileComponents();
}

// ─── ngOnInit — board loading ─────────────────────────────────────────────────

describe('TicketBoardComponent — board loading', () => {
  let fixture: ComponentFixture<TicketBoardComponent>;
  let component: TicketBoardComponent;
  let mockService: jasmine.SpyObj<TicketService>;

  beforeEach(async () => {
    mockService = makeMockTicketService();
    mockService.getBoard.and.returnValue(of(makeMockBoard()));
    mockService.getSummary.and.returnValue(of(MOCK_SUMMARY));
    await setupTestBed(mockService);

    fixture = TestBed.createComponent(TicketBoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('calls getBoard() on init', () => {
    expect(mockService.getBoard).toHaveBeenCalledTimes(1);
  });

  it('calls getSummary() after board load', () => {
    expect(mockService.getSummary).toHaveBeenCalledTimes(1);
  });

  it('sets loading to false after board load', () => {
    expect(component.loading).toBeFalse();
  });

  it('populates the todo array from board.TODO', () => {
    expect(component.todo.length).toBe(2);
    expect(component.todo[0].id).toBe(1);
    expect(component.todo[1].id).toBe(2);
  });

  it('populates the inProgress array from board.IN_PROGRESS', () => {
    expect(component.inProgress.length).toBe(1);
    expect(component.inProgress[0].id).toBe(3);
  });

  it('populates the onHold array from board.ON_HOLD', () => {
    expect(component.onHold.length).toBe(1);
    expect(component.onHold[0].id).toBe(4);
  });

  it('populates the done array from board.DONE', () => {
    expect(component.done.length).toBe(1);
    expect(component.done[0].id).toBe(5);
  });
});

// ─── Template rendering ───────────────────────────────────────────────────────

describe('TicketBoardComponent — template rendering', () => {
  let fixture: ComponentFixture<TicketBoardComponent>;

  beforeEach(async () => {
    const mockService = makeMockTicketService();
    mockService.getBoard.and.returnValue(of(makeMockBoard()));
    mockService.getSummary.and.returnValue(of(MOCK_SUMMARY));
    await setupTestBed(mockService);

    fixture = TestBed.createComponent(TicketBoardComponent);
    fixture.detectChanges();
  });

  it('renders a TODO ticket title in the board', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Ticket 1');
    expect(text).toContain('Ticket 2');
  });

  it('renders an IN_PROGRESS ticket title', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Ticket 3');
  });

  it('renders an ON_HOLD ticket title', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Ticket 4');
  });

  it('renders a DONE ticket title', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Ticket 5');
  });

  it('does not render loading spinner after board loads', () => {
    const spinner = fixture.nativeElement.querySelector('app-loading-spinner');
    expect(spinner).toBeNull();
  });
});

// ─── Loading and error states ──────────────────────────────────────────────────

describe('TicketBoardComponent — loading state', () => {
  it('shows loading spinner while board request is pending', async () => {
    const mockService = makeMockTicketService();
    // Observable that never emits — loading stays true
    mockService.getBoard.and.returnValue(new Observable(() => {}));
    mockService.getSummary.and.returnValue(of(MOCK_SUMMARY));
    await setupTestBed(mockService);

    const fixture = TestBed.createComponent(TicketBoardComponent);
    fixture.detectChanges();

    const spinner = fixture.nativeElement.querySelector('app-loading-spinner');
    expect(spinner).toBeTruthy();
  });
});

describe('TicketBoardComponent — error state', () => {
  it('shows error message when getBoard() fails', async () => {
    const mockService = makeMockTicketService();
    mockService.getBoard.and.returnValue(throwError(() => new Error('HTTP 500')));
    mockService.getSummary.and.returnValue(of(MOCK_SUMMARY));
    await setupTestBed(mockService);

    const fixture = TestBed.createComponent(TicketBoardComponent);
    fixture.detectChanges();

    const alert: HTMLElement = fixture.nativeElement.querySelector('.alert-danger');
    expect(alert).toBeTruthy();
    expect(alert.textContent).toContain('Fehler beim Laden des Boards');
  });
});

// ─── onDrop() — cross-column drop (success) ───────────────────────────────────
// Each test creates its own component (fresh board state) to avoid array mutation pollution.

describe('TicketBoardComponent — onDrop() success path', () => {
  let mockService: jasmine.SpyObj<TicketService>;

  beforeEach(async () => {
    mockService = makeMockTicketService();
    mockService.getBoard.and.callFake(() => of(makeMockBoard()));
    mockService.getSummary.and.returnValue(of(MOCK_SUMMARY));
    mockService.setStatus.and.returnValue(of(makeTicket(1, { status: 'IN_PROGRESS' })));
    await setupTestBed(mockService);
  });

  it('calls setStatus with the target status on a cross-column drop', fakeAsync(() => {
    const fixture = TestBed.createComponent(TicketBoardComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const ticket = component.todo[0];

    const dropEvent = {
      previousContainer: { data: component.todo },
      container: { data: component.inProgress },
      previousIndex: 0,
      currentIndex: 0,
      item: { data: ticket },
    } as unknown as CdkDragDrop<Ticket[]>;

    component.onDrop(dropEvent, 'IN_PROGRESS');
    tick();

    expect(mockService.setStatus).toHaveBeenCalledWith(1, 'IN_PROGRESS');
  }));

  it('does nothing when the card is dropped in the same column (no HTTP call)', fakeAsync(() => {
    const fixture = TestBed.createComponent(TicketBoardComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const ticket = component.todo[0];
    // Use the SAME object reference for both containers so === comparison is true
    const sameContainer = { data: component.todo };

    const dropEvent = {
      previousContainer: sameContainer,
      container: sameContainer,
      previousIndex: 0,
      currentIndex: 1,
      item: { data: ticket },
    } as unknown as CdkDragDrop<Ticket[]>;

    component.onDrop(dropEvent, 'TODO');
    tick();

    expect(mockService.setStatus).not.toHaveBeenCalled();
  }));

  it('refreshes summary after a successful drop', fakeAsync(() => {
    const fixture = TestBed.createComponent(TicketBoardComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    // Reset call count after ngOnInit
    mockService.getSummary.calls.reset();

    const ticket = component.todo[0];
    const dropEvent = {
      previousContainer: { data: component.todo },
      container: { data: component.inProgress },
      previousIndex: 0,
      currentIndex: 0,
      item: { data: ticket },
    } as unknown as CdkDragDrop<Ticket[]>;

    component.onDrop(dropEvent, 'IN_PROGRESS');
    tick();

    expect(mockService.getSummary).toHaveBeenCalledTimes(1);
  }));

  it('moves the card to the target column optimistically before HTTP resolves', fakeAsync(() => {
    // Use a deferred observable to check the intermediate state
    let resolver: ((t: Ticket) => void) | undefined;
    const deferred$ = new Observable<Ticket>((obs) => {
      resolver = (t) => { obs.next(t); obs.complete(); };
    });
    mockService.setStatus.and.returnValue(deferred$);

    const fixture = TestBed.createComponent(TicketBoardComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const initialTodoLength = component.todo.length;
    const ticket = component.todo[0];

    const dropEvent = {
      previousContainer: { data: component.todo },
      container: { data: component.inProgress },
      previousIndex: 0,
      currentIndex: 0,
      item: { data: ticket },
    } as unknown as CdkDragDrop<Ticket[]>;

    component.onDrop(dropEvent, 'IN_PROGRESS');

    // Before HTTP resolves: card should have moved optimistically
    expect(component.todo.length).toBe(initialTodoLength - 1);
    expect(component.inProgress.length).toBe(2); // was 1, now 2

    // Resolve to clean up subscription
    resolver!(makeTicket(1, { status: 'IN_PROGRESS' }));
    tick();
  }));
});

// ─── onDrop() — rollback on HTTP error ────────────────────────────────────────

describe('TicketBoardComponent — onDrop() error rollback', () => {
  let mockService: jasmine.SpyObj<TicketService>;
  let mockNotification: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    mockService = makeMockTicketService();
    mockNotification = makeMockNotification();
    mockService.getBoard.and.callFake(() => of(makeMockBoard()));
    mockService.getSummary.and.returnValue(of(MOCK_SUMMARY));
    mockService.setStatus.and.returnValue(throwError(() => new Error('Server error')));

    await TestBed.configureTestingModule({
      imports: [TicketBoardComponent],
      providers: [
        provideRouter([]),
        { provide: TicketService, useValue: mockService },
        { provide: NotificationService, useValue: mockNotification },
        { provide: NgbModal, useValue: makeModalStub() },
      ],
    }).compileComponents();
  });

  it('rolls back the card to the source column when setStatus() fails', fakeAsync(() => {
    const fixture = TestBed.createComponent(TicketBoardComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const initialTodoLength = component.todo.length;
    const initialInProgressLength = component.inProgress.length;
    const ticket = component.todo[0];

    const dropEvent = {
      previousContainer: { data: component.todo },
      container: { data: component.inProgress },
      previousIndex: 0,
      currentIndex: 0,
      item: { data: ticket },
    } as unknown as CdkDragDrop<Ticket[]>;

    component.onDrop(dropEvent, 'IN_PROGRESS');
    tick();
    fixture.detectChanges();

    expect(component.todo.length).toBe(initialTodoLength);
    expect(component.inProgress.length).toBe(initialInProgressLength);
  }));

  it('restores the original status on the rolled-back card', fakeAsync(() => {
    const fixture = TestBed.createComponent(TicketBoardComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const ticket = component.todo[0];
    const originalStatus = ticket.status; // 'TODO'

    const dropEvent = {
      previousContainer: { data: component.todo },
      container: { data: component.inProgress },
      previousIndex: 0,
      currentIndex: 0,
      item: { data: ticket },
    } as unknown as CdkDragDrop<Ticket[]>;

    component.onDrop(dropEvent, 'IN_PROGRESS');
    tick();

    // After rollback the ticket is back at index 0 in todo
    expect(component.todo[0].status).toBe(originalStatus);
  }));

  it('sets dropError message after failed drop', fakeAsync(() => {
    const fixture = TestBed.createComponent(TicketBoardComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const ticket = component.todo[0];

    const dropEvent = {
      previousContainer: { data: component.todo },
      container: { data: component.inProgress },
      previousIndex: 0,
      currentIndex: 0,
      item: { data: ticket },
    } as unknown as CdkDragDrop<Ticket[]>;

    component.onDrop(dropEvent, 'IN_PROGRESS');
    tick();

    expect(component.dropError).toContain('Fehler beim Verschieben');
  }));

  it('shows a notification error after failed drop', fakeAsync(() => {
    const fixture = TestBed.createComponent(TicketBoardComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const ticket = component.todo[0];

    const dropEvent = {
      previousContainer: { data: component.todo },
      container: { data: component.inProgress },
      previousIndex: 0,
      currentIndex: 0,
      item: { data: ticket },
    } as unknown as CdkDragDrop<Ticket[]>;

    component.onDrop(dropEvent, 'IN_PROGRESS');
    tick();

    expect(mockNotification.error).toHaveBeenCalled();
  }));
});

// ─── Done column: solution badge ──────────────────────────────────────────────

describe('TicketBoardComponent — Done column solution badge', () => {
  let component: TicketBoardComponent;

  beforeEach(async () => {
    const doneTicket = makeTicket(5, { status: 'DONE', solution: 'DONE' });
    const wontDoTicket = makeTicket(6, { status: 'DONE', solution: 'WONT_DO', owner: 'HUMAN' });
    const boardWithDoneTickets: TicketBoard = {
      TODO: [],
      IN_PROGRESS: [],
      ON_HOLD: [],
      DONE: [doneTicket, wontDoTicket],
    };

    const mockService = makeMockTicketService();
    mockService.getBoard.and.returnValue(of(boardWithDoneTickets));
    mockService.getSummary.and.returnValue(of(MOCK_SUMMARY));
    await setupTestBed(mockService);

    const fixture = TestBed.createComponent(TicketBoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('solutionBadgeClass returns solution-done class for DONE solution', () => {
    expect(component.solutionBadgeClass('DONE')).toContain('solution-done');
  });

  it('solutionBadgeClass returns solution-wontdo class for WONT_DO solution', () => {
    expect(component.solutionBadgeClass('WONT_DO')).toContain('solution-wontdo');
  });

  it('solutionLabel returns "Erledigt" for DONE solution', () => {
    expect(component.solutionLabel('DONE')).toBe('Erledigt');
  });

  it('solutionLabel returns "Wird nicht gemacht" for WONT_DO solution', () => {
    expect(component.solutionLabel('WONT_DO')).toBe('Wird nicht gemacht');
  });

  it('done column renders both solution badge labels', () => {
    const text: string = document.body.textContent ?? '';
    expect(text).toContain('Erledigt');
    expect(text).toContain('Wird nicht gemacht');
  });
});

// ─── Owner badge ──────────────────────────────────────────────────────────────

describe('TicketBoardComponent — owner badge helpers', () => {
  let component: TicketBoardComponent;

  beforeEach(async () => {
    const mockService = makeMockTicketService();
    mockService.getBoard.and.returnValue(of(makeMockBoard()));
    mockService.getSummary.and.returnValue(of(MOCK_SUMMARY));
    await setupTestBed(mockService);

    const fixture = TestBed.createComponent(TicketBoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('ownerBadgeClass returns "badge owner-ai" for AI owner', () => {
    expect(component.ownerBadgeClass('AI')).toBe('badge owner-ai');
  });

  it('ownerBadgeClass returns "badge owner-human" for HUMAN owner', () => {
    expect(component.ownerBadgeClass('HUMAN')).toBe('badge owner-human');
  });

  it('ownerLabel returns "KI" for AI', () => {
    expect(component.ownerLabel('AI')).toBe('KI');
  });

  it('ownerLabel returns "Mensch" for HUMAN', () => {
    expect(component.ownerLabel('HUMAN')).toBe('Mensch');
  });

  it('todo column contains at least one AI-owned ticket', () => {
    expect(component.todo.some((t) => t.owner === 'AI')).toBeTrue();
  });
});

// ─── Type badge helpers ───────────────────────────────────────────────────────

describe('TicketBoardComponent — typeBadgeClass() and typeLabel()', () => {
  let component: TicketBoardComponent;

  beforeEach(async () => {
    const mockService = makeMockTicketService();
    mockService.getBoard.and.returnValue(of(makeMockBoard()));
    mockService.getSummary.and.returnValue(of(MOCK_SUMMARY));
    await setupTestBed(mockService);

    const fixture = TestBed.createComponent(TicketBoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('typeBadgeClass returns "badge type-feature" for FEATURE', () => {
    expect(component.typeBadgeClass('FEATURE')).toBe('badge type-feature');
  });

  it('typeBadgeClass returns "badge type-bug" for BUG', () => {
    expect(component.typeBadgeClass('BUG')).toBe('badge type-bug');
  });

  it('typeBadgeClass returns "badge type-chore" for CHORE', () => {
    expect(component.typeBadgeClass('CHORE')).toBe('badge type-chore');
  });

  it('typeLabel returns "Feature" for FEATURE', () => {
    expect(component.typeLabel('FEATURE')).toBe('Feature');
  });

  it('typeLabel returns "Bug" for BUG', () => {
    expect(component.typeLabel('BUG')).toBe('Bug');
  });

  it('typeLabel returns "Aufgabe" for CHORE', () => {
    expect(component.typeLabel('CHORE')).toBe('Aufgabe');
  });
});
