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
    DEFINITION: [makeTicket(0, { status: 'DEFINITION' })],
    TODO: [makeTicket(1), makeTicket(2)],
    IN_PROGRESS: [makeTicket(3, { status: 'IN_PROGRESS' })],
    ON_HOLD: [makeTicket(4, { status: 'ON_HOLD', owner: 'HUMAN' })],
    DONE: [makeTicket(5, { status: 'DONE', solution: 'DONE' })],
  };
}

const MOCK_SUMMARY: TicketSummary = {
  byStatus: { DEFINITION: 1, TODO: 2, IN_PROGRESS: 1, ON_HOLD: 1, DONE: 1 },
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

  it('populates the definition array from board.DEFINITION', () => {
    expect(component.definition.length).toBe(1);
    expect(component.definition[0].id).toBe(0);
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

  it('renders a "Definition" column header', () => {
    const header: HTMLElement = fixture.nativeElement.querySelector('.column-definition .column-title');
    expect(header).toBeTruthy();
    expect(header.textContent).toContain('Definition');
  });

  it('renders a DEFINITION ticket title in the Definition column', () => {
    const definitionColumn: HTMLElement = fixture.nativeElement.querySelector('#list-DEFINITION');
    expect(definitionColumn.textContent).toContain('Ticket 0');
  });

  it('renders the "Zu bereit" column header for the TODO column (renamed from "Zu erledigen")', () => {
    const header: HTMLElement = fixture.nativeElement.querySelector('.column-todo .column-title');
    expect(header).toBeTruthy();
    expect(header.textContent).toContain('Zu bereit');
  });

  it('renders exactly 5 board columns', () => {
    const columns = fixture.nativeElement.querySelectorAll('.board-column');
    expect(columns.length).toBe(5);
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

  it('sets solution to "DONE" on the moved card when dropping INTO the DONE column', fakeAsync(() => {
    mockService.setStatus.and.returnValue(of(makeTicket(1, { status: 'DONE', solution: 'DONE' })));

    const fixture = TestBed.createComponent(TicketBoardComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const ticket = component.todo[0]; // starts with solution: null
    expect(ticket.solution).toBeNull();

    const dropEvent = {
      previousContainer: { data: component.todo },
      container: { data: component.done },
      previousIndex: 0,
      currentIndex: 0,
      item: { data: ticket },
    } as unknown as CdkDragDrop<Ticket[]>;

    component.onDrop(dropEvent, 'DONE');
    tick();

    // After optimistic update the moved card in the done array has solution === 'DONE'
    expect(component.done[0].solution).toBe('DONE');
  }));

  it('sets solution to null on the moved card when dropping OUT of the DONE column', fakeAsync(() => {
    mockService.setStatus.and.returnValue(of(makeTicket(5, { status: 'TODO', solution: null })));

    // Build a board that has a DONE ticket to drag out
    const boardWithDone: TicketBoard = {
      DEFINITION: [],
      TODO: [],
      IN_PROGRESS: [],
      ON_HOLD: [],
      DONE: [makeTicket(5, { status: 'DONE', solution: 'DONE' })],
    };
    mockService.getBoard.and.returnValue(of(boardWithDone));

    const fixture = TestBed.createComponent(TicketBoardComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const ticket = component.done[0]; // solution === 'DONE'
    expect(ticket.solution).toBe('DONE');

    const dropEvent = {
      previousContainer: { data: component.done },
      container: { data: component.todo },
      previousIndex: 0,
      currentIndex: 0,
      item: { data: ticket },
    } as unknown as CdkDragDrop<Ticket[]>;

    component.onDrop(dropEvent, 'TODO');
    tick();

    // After optimistic update the moved card in todo has solution === null
    expect(component.todo[0].solution).toBeNull();
  }));
});

// ─── onDrop() — rollback on HTTP error ────────────────────────────────────────

describe('TicketBoardComponent — onDrop() error rollback', () => {
  let mockService: jasmine.SpyObj<TicketService>;
  let mockNotification: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    // Start from a known-clean slate — see afterEach below for why this matters.
    sessionStorage.removeItem('ticketBoard.recentOnly');

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

  afterEach(() => {
    // One test below calls toggleRecent(), which now persists to sessionStorage.
    // Clear it so it can't leak recentOnly=true into a sibling spec.
    sessionStorage.removeItem('ticketBoard.recentOnly');
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

  it('restores the original status and solution on the rolled-back card', fakeAsync(() => {
    const fixture = TestBed.createComponent(TicketBoardComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const ticket = component.todo[0];
    const originalStatus = ticket.status; // 'TODO'
    const originalSolution = ticket.solution; // null

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
    expect(component.todo[0].solution).toBe(originalSolution);
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

  it('keeps the filtered view arrays consistent with the master arrays after a failed drop while recentOnly is active', fakeAsync(() => {
    const fixture = TestBed.createComponent(TicketBoardComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    // Make the affected tickets "recent" so they survive the recentOnly filter,
    // then switch to the filtered view — view arrays become copies, not the master arrays.
    const now = new Date().toISOString();
    component.todo.forEach((t) => {
      t.updatedAt = now;
      t.createdAt = now;
    });
    component.inProgress.forEach((t) => {
      t.updatedAt = now;
      t.createdAt = now;
    });
    component.toggleRecent();
    expect(component.recentOnly).toBeTrue();

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

    // After the rollback, the filtered view arrays must reflect the rolled-back master arrays.
    expect(component.viewTodo).toEqual(component.todo);
    expect(component.viewInProgress).toEqual(component.inProgress);
  }));
});

// ─── Done column: solution badge ──────────────────────────────────────────────

describe('TicketBoardComponent — Done column solution badge', () => {
  let fixture: ComponentFixture<TicketBoardComponent>;
  let component: TicketBoardComponent;

  beforeEach(async () => {
    const doneTicket = makeTicket(5, { status: 'DONE', solution: 'DONE' });
    const wontDoTicket = makeTicket(6, { status: 'DONE', solution: 'WONT_DO', owner: 'HUMAN' });
    const boardWithDoneTickets: TicketBoard = {
      DEFINITION: [],
      TODO: [],
      IN_PROGRESS: [],
      ON_HOLD: [],
      DONE: [doneTicket, wontDoTicket],
    };

    const mockService = makeMockTicketService();
    mockService.getBoard.and.returnValue(of(boardWithDoneTickets));
    mockService.getSummary.and.returnValue(of(MOCK_SUMMARY));
    await setupTestBed(mockService);

    fixture = TestBed.createComponent(TicketBoardComponent);
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

  it('done column renders both solution badge labels within THIS component', () => {
    // Scoped to fixture.nativeElement — not document.body — to prevent cross-test leakage.
    const text: string = fixture.nativeElement.textContent ?? '';
    expect(text).toContain('Erledigt');
    expect(text).toContain('Wird nicht gemacht');
  });
});

// ─── Solution badge absent on non-Done cards ──────────────────────────────────

describe('TicketBoardComponent — solution badge absent on non-Done cards', () => {
  let fixture: ComponentFixture<TicketBoardComponent>;

  beforeEach(async () => {
    // Board with only TODO / IN_PROGRESS / ON_HOLD tickets — all solution: null
    const boardNoSolution: TicketBoard = {
      DEFINITION: [],
      TODO: [makeTicket(1), makeTicket(2)],
      IN_PROGRESS: [makeTicket(3, { status: 'IN_PROGRESS' })],
      ON_HOLD: [makeTicket(4, { status: 'ON_HOLD' })],
      DONE: [],
    };

    const mockService = makeMockTicketService();
    mockService.getBoard.and.returnValue(of(boardNoSolution));
    mockService.getSummary.and.returnValue(of(MOCK_SUMMARY));
    await setupTestBed(mockService);

    fixture = TestBed.createComponent(TicketBoardComponent);
    fixture.detectChanges();
  });

  it('does not render any solution badge for TODO tickets', () => {
    const solutionBadges = fixture.nativeElement.querySelectorAll(
      '[class*="solution-done"], [class*="solution-wontdo"]',
    );
    expect(solutionBadges.length).toBe(0);
  });

  it('does not render "Erledigt" solution label in the TODO column', () => {
    // The word "Erledigt" appears in the KPI tile label — verify no solution BADGE text.
    // Check that no element with a solution CSS class exists.
    const badges: NodeListOf<Element> = fixture.nativeElement.querySelectorAll(
      '.solution-done, .solution-wontdo',
    );
    expect(badges.length).toBe(0);
  });

  it('does not render "Wird nicht gemacht" solution label anywhere in the board columns', () => {
    // This label only appears on WONT_DO solution badges — should be absent here.
    const boardContainer: HTMLElement | null =
      fixture.nativeElement.querySelector('.board-container');
    expect(boardContainer).toBeTruthy();
    expect(boardContainer!.textContent).not.toContain('Wird nicht gemacht');
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

// ─── "Kürzlich geändert" toggle ────────────────────────────────────────────────

describe('TicketBoardComponent — recent-only toggle', () => {
  let fixture: ComponentFixture<TicketBoardComponent>;
  let component: TicketBoardComponent;

  beforeEach(async () => {
    // toggleRecent() persists to sessionStorage — start from a known-clean slate
    // regardless of what a sibling spec (possibly run before this one under
    // Jasmine's random spec order) may have left behind.
    sessionStorage.removeItem('ticketBoard.recentOnly');

    const mockService = makeMockTicketService();
    mockService.getBoard.and.returnValue(of(makeMockBoard()));
    mockService.getSummary.and.returnValue(of(MOCK_SUMMARY));
    await setupTestBed(mockService);

    fixture = TestBed.createComponent(TicketBoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    // Several tests below call toggleRecent(), writing to real sessionStorage —
    // clear it so it can't leak recentOnly=true into a sibling spec.
    sessionStorage.removeItem('ticketBoard.recentOnly');
  });

  it('defaults recentOnly to false', () => {
    expect(component.recentOnly).toBeFalse();
  });

  it('populates the view arrays with the full arrays after loadBoard()', () => {
    expect(component.viewDefinition).toEqual(component.definition);
    expect(component.viewTodo).toEqual(component.todo);
    expect(component.viewInProgress).toEqual(component.inProgress);
    expect(component.viewOnHold).toEqual(component.onHold);
    expect(component.viewDone).toEqual(component.done);
  });

  it('isRecent() returns true for a ticket updated 30 minutes ago', () => {
    const ticket = makeTicket(100, {
      updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    });
    expect(component.isRecent(ticket)).toBeTrue();
  });

  it('isRecent() returns false when both createdAt and updatedAt are 90 minutes ago', () => {
    const ticket = makeTicket(101, {
      updatedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    });
    expect(component.isRecent(ticket)).toBeFalse();
  });

  it('toggleRecent() sets recentOnly to true and filters the view arrays to only recent tickets', () => {
    // Make one ticket recent, the rest old — reuse the TODO column (2 tickets)
    component.todo[0].updatedAt = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    component.todo[0].createdAt = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    component.todo[1].updatedAt = new Date(Date.now() - 90 * 60 * 1000).toISOString();
    component.todo[1].createdAt = new Date(Date.now() - 90 * 60 * 1000).toISOString();

    component.toggleRecent();

    expect(component.recentOnly).toBeTrue();
    expect(component.viewTodo.length).toBe(1);
    expect(component.viewTodo[0].id).toBe(component.todo[0].id);
  });

  it('toggling recentOnly a second time restores the full view arrays (same references)', () => {
    component.toggleRecent();
    expect(component.recentOnly).toBeTrue();

    component.toggleRecent();

    expect(component.recentOnly).toBeFalse();
    expect(component.viewDefinition).toBe(component.definition);
    expect(component.viewTodo).toBe(component.todo);
    expect(component.viewInProgress).toBe(component.inProgress);
    expect(component.viewOnHold).toBe(component.onHold);
    expect(component.viewDone).toBe(component.done);
  });

  it('renders the "Kürzlich geändert" label by default and flips to "Alle" when pressed', () => {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.page-header button.btn-outline-secondary',
    );
    expect(button).toBeTruthy();
    expect(button.textContent).toContain('Kürzlich geändert');

    button.click();
    fixture.detectChanges();

    expect(button.textContent).toContain('Alle');
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });

  it('shows the recent-only info banner while filtering is active, and hides it again when toggled off', () => {
    let banner: HTMLElement | null = fixture.nativeElement.querySelector('.alert-info');
    expect(banner).toBeNull();

    component.toggleRecent();
    fixture.detectChanges();

    banner = fixture.nativeElement.querySelector('.alert-info');
    expect(banner).toBeTruthy();
    expect(banner!.textContent).toContain('Gefiltert');

    component.toggleRecent();
    fixture.detectChanges();

    banner = fixture.nativeElement.querySelector('.alert-info');
    expect(banner).toBeNull();
  });

  it('shows "Keine kürzlich geänderten Tickets" in every column while filtering is active', () => {
    // The mock board tickets are all far outside the 60-minute window, so every column empties out.
    component.toggleRecent();
    fixture.detectChanges();

    const emptyMessages: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.column-empty');
    expect(emptyMessages.length).toBe(5);
    emptyMessages.forEach((el) => {
      expect(el.textContent).toContain('Keine kürzlich geänderten Tickets');
    });
  });
});

// ─── recentOnly sessionStorage persistence ────────────────────────────────────

describe('TicketBoardComponent — recentOnly sessionStorage persistence', () => {
  const STORAGE_KEY = 'ticketBoard.recentOnly';

  // Create (but do not initialize) a component so the caller can seed sessionStorage
  // BEFORE the first detectChanges()/ngOnInit() call.
  async function createUninitializedComponent(): Promise<{
    fixture: ComponentFixture<TicketBoardComponent>;
    component: TicketBoardComponent;
  }> {
    const mockService = makeMockTicketService();
    mockService.getBoard.and.returnValue(of(makeMockBoard()));
    mockService.getSummary.and.returnValue(of(MOCK_SUMMARY));
    await setupTestBed(mockService);

    const fixture = TestBed.createComponent(TicketBoardComponent);
    return { fixture, component: fixture.componentInstance };
  }

  afterEach(() => {
    sessionStorage.removeItem(STORAGE_KEY);
  });

  it('initializes recentOnly to true when sessionStorage holds "true"', async () => {
    sessionStorage.setItem(STORAGE_KEY, 'true');

    const { fixture, component } = await createUninitializedComponent();
    fixture.detectChanges();

    expect(component.recentOnly).toBeTrue();
  });

  it('filters the view arrays to match the restored recentOnly value on init', async () => {
    sessionStorage.setItem(STORAGE_KEY, 'true');

    const { fixture, component } = await createUninitializedComponent();
    fixture.detectChanges();

    // Mock board tickets are dated 2024-06-01 — none fall inside the 60-minute
    // "recent" window, so a restored recentOnly=true empties every view array.
    expect(component.viewDefinition.length).toBe(0);
    expect(component.viewTodo.length).toBe(0);
    expect(component.viewInProgress.length).toBe(0);
    expect(component.viewOnHold.length).toBe(0);
    expect(component.viewDone.length).toBe(0);
  });

  it('initializes recentOnly to false when nothing is stored in sessionStorage', async () => {
    const { fixture, component } = await createUninitializedComponent();
    fixture.detectChanges();

    expect(component.recentOnly).toBeFalse();
  });

  it('initializes recentOnly to false when sessionStorage holds a value other than "true"', async () => {
    sessionStorage.setItem(STORAGE_KEY, 'false');

    const { fixture, component } = await createUninitializedComponent();
    fixture.detectChanges();

    expect(component.recentOnly).toBeFalse();
  });

  it('toggleRecent() writes "true" to sessionStorage when switching filtering on', async () => {
    const { fixture, component } = await createUninitializedComponent();
    fixture.detectChanges();
    expect(component.recentOnly).toBeFalse();

    component.toggleRecent();

    expect(sessionStorage.getItem(STORAGE_KEY)).toBe('true');
  });

  it('toggleRecent() writes "false" to sessionStorage when switching filtering off', async () => {
    sessionStorage.setItem(STORAGE_KEY, 'true');
    const { fixture, component } = await createUninitializedComponent();
    fixture.detectChanges();
    expect(component.recentOnly).toBeTrue();

    component.toggleRecent();

    expect(sessionStorage.getItem(STORAGE_KEY)).toBe('false');
  });

  it('does not throw on init and defaults recentOnly to false when sessionStorage.getItem() throws', async () => {
    spyOn(sessionStorage, 'getItem').and.throwError('Storage disabled');

    const { fixture, component } = await createUninitializedComponent();

    expect(() => fixture.detectChanges()).not.toThrow();
    expect(component.recentOnly).toBeFalse();
  });

  it('toggleRecent() does not throw when sessionStorage.setItem() throws', async () => {
    const { fixture, component } = await createUninitializedComponent();
    fixture.detectChanges();

    spyOn(sessionStorage, 'setItem').and.throwError('Storage disabled');

    expect(() => component.toggleRecent()).not.toThrow();
    // The in-memory toggle still happens even though persistence failed silently.
    expect(component.recentOnly).toBeTrue();
  });
});
