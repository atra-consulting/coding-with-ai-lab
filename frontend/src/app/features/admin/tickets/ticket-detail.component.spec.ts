import { TestBed } from '@angular/core/testing';
import { ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TicketDetailComponent } from './ticket-detail.component';
import { TicketService } from '../../../core/services/ticket.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Ticket, TicketComment } from '../../../core/models/ticket.model';

// ─── Test-data factories ──────────────────────────────────────────────────────

function makeComment(id: number, author: TicketComment['author'] = 'AGENT'): TicketComment {
  return {
    id,
    ticketId: 10,
    author,
    authorName: author === 'AGENT' ? 'Claude Code' : 'Admin',
    body: `Comment ${id} body`,
    createdAt: '2024-06-01T08:00:00.000Z',
  };
}

function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: 10,
    owner: 'HUMAN',
    type: 'FEATURE',
    title: 'CSV-Export für Firmenliste',
    body: 'Bitte CSV-Export implementieren.',
    status: 'ON_HOLD',
    solution: null,
    commentCount: 2,
    comments: [makeComment(1, 'AGENT'), makeComment(2, 'HUMAN')],
    pickedUpAt: null,
    resolvedAt: null,
    createdAt: '2024-06-01T07:00:00.000Z',
    updatedAt: '2024-06-01T09:00:00.000Z',
    ...overrides,
  };
}

const MOCK_TICKET = makeTicket();

// ─── Shared helpers ───────────────────────────────────────────────────────────

function makeRoute(id: string): Partial<ActivatedRoute> {
  return {
    snapshot: {
      paramMap: convertToParamMap({ id }),
    } as ActivatedRoute['snapshot'],
  };
}

function makeMockTicketService(): jasmine.SpyObj<TicketService> {
  return jasmine.createSpyObj<TicketService>('TicketService', [
    'getBoard',
    'getSummary',
    'getById',
    'getAll',
    'create',
    'setStatus',
    'setOwner',
    'handToAi',
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

// NgbModal stub: open() returns a resolved promise by default (confirm accepted)
function makeModalStub(resolveResult: unknown = true): Partial<NgbModal> {
  return {
    open: jasmine.createSpy('open').and.returnValue({
      componentInstance: {
        title: '',
        message: '',
        confirmText: '',
        confirmButtonClass: '',
      },
      result: Promise.resolve(resolveResult),
    }),
  };
}

// NgbModal stub that rejects (confirm dismissed)
function makeModalDismissStub(): Partial<NgbModal> {
  return {
    open: jasmine.createSpy('open').and.returnValue({
      componentInstance: {
        title: '',
        message: '',
        confirmText: '',
        confirmButtonClass: '',
      },
      result: Promise.reject('dismissed'),
    }),
  };
}

// ─── Basic creation and load ──────────────────────────────────────────────────

describe('TicketDetailComponent — creation and load', () => {
  let fixture: ComponentFixture<TicketDetailComponent>;
  let component: TicketDetailComponent;
  let mockService: jasmine.SpyObj<TicketService>;

  beforeEach(async () => {
    mockService = makeMockTicketService();
    mockService.getById.and.returnValue(of(MOCK_TICKET));

    await TestBed.configureTestingModule({
      imports: [TicketDetailComponent],
      providers: [
        provideRouter([]),
        { provide: TicketService, useValue: mockService },
        { provide: NotificationService, useValue: makeMockNotification() },
        { provide: NgbModal, useValue: makeModalStub() },
        { provide: ActivatedRoute, useValue: makeRoute('10') },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TicketDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('calls getById() with the numeric id from the route snapshot', () => {
    expect(mockService.getById).toHaveBeenCalledWith(10);
  });

  it('sets loading to false after ticket load', () => {
    expect(component.loading).toBeFalse();
  });

  it('stores the loaded ticket on the component', () => {
    expect(component.ticket).toEqual(MOCK_TICKET);
  });
});

// ─── Template rendering ───────────────────────────────────────────────────────

describe('TicketDetailComponent — template rendering', () => {
  let fixture: ComponentFixture<TicketDetailComponent>;

  beforeEach(async () => {
    const mockService = makeMockTicketService();
    mockService.getById.and.returnValue(of(MOCK_TICKET));

    await TestBed.configureTestingModule({
      imports: [TicketDetailComponent],
      providers: [
        provideRouter([]),
        { provide: TicketService, useValue: mockService },
        { provide: NotificationService, useValue: makeMockNotification() },
        { provide: NgbModal, useValue: makeModalStub() },
        { provide: ActivatedRoute, useValue: makeRoute('10') },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TicketDetailComponent);
    fixture.detectChanges();
  });

  it('renders the ticket id in the page header', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Ticket #10');
  });

  it('renders the ticket title', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('CSV-Export für Firmenliste');
  });

  it('renders the ticket body in a <pre> element', () => {
    const pre: HTMLElement = fixture.nativeElement.querySelector('pre');
    expect(pre).toBeTruthy();
    expect(pre.textContent).toContain('Bitte CSV-Export implementieren.');
  });

  it('renders both comments in the comment thread', () => {
    const commentItems = fixture.nativeElement.querySelectorAll('.comment-item');
    expect(commentItems.length).toBe(2);
  });

  it('renders AGENT comment with comment-agent class', () => {
    const agentComments = fixture.nativeElement.querySelectorAll('.comment-agent');
    expect(agentComments.length).toBe(1);
  });

  it('renders HUMAN comment with comment-human class', () => {
    const humanComments = fixture.nativeElement.querySelectorAll('.comment-human');
    expect(humanComments.length).toBe(1);
  });

  it('renders comment body text', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Comment 1 body');
    expect(text).toContain('Comment 2 body');
  });

  it('renders "Claude Code" as author name for AGENT comment', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Claude Code');
  });
});

// ─── Empty comment thread ─────────────────────────────────────────────────────

describe('TicketDetailComponent — no comments', () => {
  let fixture: ComponentFixture<TicketDetailComponent>;

  beforeEach(async () => {
    const ticketNoComments = makeTicket({ comments: [], commentCount: 0 });
    const mockService = makeMockTicketService();
    mockService.getById.and.returnValue(of(ticketNoComments));

    await TestBed.configureTestingModule({
      imports: [TicketDetailComponent],
      providers: [
        provideRouter([]),
        { provide: TicketService, useValue: mockService },
        { provide: NotificationService, useValue: makeMockNotification() },
        { provide: NgbModal, useValue: makeModalStub() },
        { provide: ActivatedRoute, useValue: makeRoute('10') },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TicketDetailComponent);
    fixture.detectChanges();
  });

  it('shows "Noch keine Kommentare." when there are no comments', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Noch keine Kommentare.');
  });

  it('renders no comment-item elements when comments list is empty', () => {
    const items = fixture.nativeElement.querySelectorAll('.comment-item');
    expect(items.length).toBe(0);
  });
});

// ─── Error state ──────────────────────────────────────────────────────────────

describe('TicketDetailComponent — error state', () => {
  it('shows error message when getById() fails', async () => {
    const mockService = makeMockTicketService();
    mockService.getById.and.returnValue(throwError(() => new Error('Not found')));

    await TestBed.configureTestingModule({
      imports: [TicketDetailComponent],
      providers: [
        provideRouter([]),
        { provide: TicketService, useValue: mockService },
        { provide: NotificationService, useValue: makeMockNotification() },
        { provide: NgbModal, useValue: makeModalStub() },
        { provide: ActivatedRoute, useValue: makeRoute('99') },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(TicketDetailComponent);
    fixture.detectChanges();

    const alert: HTMLElement = fixture.nativeElement.querySelector('.alert-danger');
    expect(alert).toBeTruthy();
    expect(alert.textContent).toContain('Ticket nicht gefunden');
  });
});

// ─── "Zurück an KI" button ────────────────────────────────────────────────────

describe('TicketDetailComponent — "Zurück an KI" (handBackToAi)', () => {
  let fixture: ComponentFixture<TicketDetailComponent>;
  let component: TicketDetailComponent;
  let mockService: jasmine.SpyObj<TicketService>;

  // Ticket owner = HUMAN so the button is enabled
  const humanTicket = makeTicket({ owner: 'HUMAN', status: 'ON_HOLD' });

  beforeEach(async () => {
    mockService = makeMockTicketService();
    mockService.getById.and.returnValue(of(humanTicket));
    mockService.addComment.and.returnValue(of({ ...humanTicket, owner: 'AI', status: 'TODO' }));

    await TestBed.configureTestingModule({
      imports: [TicketDetailComponent],
      providers: [
        provideRouter([]),
        { provide: TicketService, useValue: mockService },
        { provide: NotificationService, useValue: makeMockNotification() },
        { provide: NgbModal, useValue: makeModalStub() },
        { provide: ActivatedRoute, useValue: makeRoute('10') },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TicketDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('calls addComment() with handBackToAi: true when "Zurück an KI" is clicked', fakeAsync(() => {
    // Fill the comment body so the form is valid
    component.commentForm.controls.body.setValue('Hier ist die Antwort.');
    fixture.detectChanges();

    component.addComment(true);
    tick();

    expect(mockService.addComment).toHaveBeenCalledWith(10, {
      body: 'Hier ist die Antwort.',
      handBackToAi: true,
    });
  }));

  it('"Zurück an KI" button is disabled when ticket.owner is AI', async () => {
    // Switch to an AI-owned ticket
    const aiTicket = makeTicket({ owner: 'AI' });
    mockService.getById.and.returnValue(of(aiTicket));

    const fixture2 = TestBed.createComponent(TicketDetailComponent);
    fixture2.detectChanges();

    // Fill in body so only the owner condition matters
    const comp2 = fixture2.componentInstance;
    comp2.commentForm.controls.body.setValue('Test');
    fixture2.detectChanges();

    // The "Zurück an KI" button carries [disabled] when owner !== 'HUMAN'
    const buttons: NodeListOf<HTMLButtonElement> = fixture2.nativeElement.querySelectorAll('button');
    const handBackBtn = Array.from(buttons).find((b) =>
      b.textContent?.includes('Zurück an KI'),
    );
    expect(handBackBtn).toBeTruthy();
    expect(handBackBtn!.disabled).toBeTrue();
  });

  it('"Zurück an KI" button is disabled when owner is HUMAN but comment body is empty', () => {
    // owner === 'HUMAN' (humanTicket), body is empty by default
    component.commentForm.controls.body.setValue('');
    fixture.detectChanges();

    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('button');
    const handBackBtn = Array.from(buttons).find((b) =>
      b.textContent?.includes('Zurück an KI'),
    );
    expect(handBackBtn).toBeTruthy();
    // Disabled because body.trim().length === 0, even though owner is HUMAN
    expect(handBackBtn!.disabled).toBeTrue();
  });

  it('shows the hint "Die KI ist bereits Eigentümer." when owner is AI', async () => {
    const aiTicket = makeTicket({ owner: 'AI' });
    mockService.getById.and.returnValue(of(aiTicket));

    const fixture2 = TestBed.createComponent(TicketDetailComponent);
    fixture2.detectChanges();

    const text: string = fixture2.nativeElement.textContent;
    expect(text).toContain('Die KI ist bereits Eigentümer.');
  });

  it('does NOT call addComment() when form is invalid (empty body)', fakeAsync(() => {
    // body is empty by default — form is invalid
    component.commentForm.controls.body.setValue('');
    component.addComment(true);
    tick();

    expect(mockService.addComment).not.toHaveBeenCalled();
  }));

  it('resets the form after successful addComment', fakeAsync(() => {
    component.commentForm.controls.body.setValue('Fertig, bitte weiter.');
    component.addComment(true);
    tick();

    expect(component.commentForm.controls.body.value).toBe('');
  }));
});

// ─── addComment() — error path ────────────────────────────────────────────────

describe('TicketDetailComponent — addComment() error path', () => {
  let fixture: ComponentFixture<TicketDetailComponent>;
  let component: TicketDetailComponent;

  beforeEach(async () => {
    const mockService = makeMockTicketService();
    mockService.getById.and.returnValue(of(makeTicket({ owner: 'HUMAN', status: 'ON_HOLD' })));
    mockService.addComment.and.returnValue(throwError(() => new Error('Server error')));

    await TestBed.configureTestingModule({
      imports: [TicketDetailComponent],
      providers: [
        provideRouter([]),
        { provide: TicketService, useValue: mockService },
        { provide: NotificationService, useValue: makeMockNotification() },
        { provide: NgbModal, useValue: makeModalStub() },
        { provide: ActivatedRoute, useValue: makeRoute('10') },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TicketDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('sets commentError when addComment() service call fails', fakeAsync(() => {
    component.commentForm.controls.body.setValue('Mein Kommentar');
    component.addComment(false);
    tick();

    expect(component.commentError).toBe('Fehler beim Speichern des Kommentars.');
  }));

  it('renders .alert-danger with the German error message after addComment() fails', fakeAsync(() => {
    component.commentForm.controls.body.setValue('Mein Kommentar');
    component.addComment(false);
    tick();
    fixture.detectChanges();

    const alert: HTMLElement = fixture.nativeElement.querySelector('.alert-danger');
    expect(alert).toBeTruthy();
    expect(alert.textContent).toContain('Fehler beim Speichern des Kommentars.');
  }));
});

// ─── "Won't Do" button visibility and call ───────────────────────────────────

describe('TicketDetailComponent — "Won\'t Do" button', () => {
  let fixture: ComponentFixture<TicketDetailComponent>;
  let component: TicketDetailComponent;
  let mockService: jasmine.SpyObj<TicketService>;
  let mockNotification: jasmine.SpyObj<NotificationService>;

  const humanOnHoldTicket = makeTicket({ owner: 'HUMAN', status: 'ON_HOLD' });

  beforeEach(async () => {
    mockService = makeMockTicketService();
    mockNotification = makeMockNotification();
    mockService.getById.and.returnValue(of(humanOnHoldTicket));
    mockService.wontDo.and.returnValue(
      of({ ...humanOnHoldTicket, status: 'DONE', solution: 'WONT_DO' }),
    );

    await TestBed.configureTestingModule({
      imports: [TicketDetailComponent],
      providers: [
        provideRouter([]),
        { provide: TicketService, useValue: mockService },
        { provide: NotificationService, useValue: mockNotification },
        { provide: NgbModal, useValue: makeModalStub() },
        { provide: ActivatedRoute, useValue: makeRoute('10') },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TicketDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the "Wird nicht gemacht" button when owner=HUMAN and status is not DONE', () => {
    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('button');
    const wontDoBtn = Array.from(buttons).find((b) =>
      b.textContent?.includes('Wird nicht gemacht'),
    );
    expect(wontDoBtn).toBeTruthy();
  });

  it('calls wontDo() after the confirm dialog resolves', fakeAsync(() => {
    component.markWontDo();
    tick(); // resolve the modal promise

    expect(mockService.wontDo).toHaveBeenCalledWith(10);
  }));

  it('updates the ticket to solution=WONT_DO after wontDo() succeeds', fakeAsync(() => {
    component.markWontDo();
    tick();

    expect(component.ticket?.solution).toBe('WONT_DO');
    expect(component.ticket?.status).toBe('DONE');
  }));
});

// ─── "Won't Do" dismissed — separate describe to avoid TestBed.resetTestingModule inside fakeAsync ──

describe('TicketDetailComponent — "Won\'t Do" dismissed modal', () => {
  let component: TicketDetailComponent;
  let mockService: jasmine.SpyObj<TicketService>;

  const humanOnHoldTicket = makeTicket({ owner: 'HUMAN', status: 'ON_HOLD' });

  beforeEach(async () => {
    mockService = makeMockTicketService();
    mockService.getById.and.returnValue(of(humanOnHoldTicket));
    mockService.wontDo.and.returnValue(
      of({ ...humanOnHoldTicket, status: 'DONE', solution: 'WONT_DO' }),
    );

    await TestBed.configureTestingModule({
      imports: [TicketDetailComponent],
      providers: [
        provideRouter([]),
        { provide: TicketService, useValue: mockService },
        { provide: NotificationService, useValue: makeMockNotification() },
        // Dismiss stub — modal promise rejects
        { provide: NgbModal, useValue: makeModalDismissStub() },
        { provide: ActivatedRoute, useValue: makeRoute('10') },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(TicketDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('does NOT call wontDo() when the confirm dialog is dismissed', fakeAsync(() => {
    component.markWontDo();
    tick(); // the promise rejects (dismissed)

    expect(mockService.wontDo).not.toHaveBeenCalled();
  }));
});

// ─── "Won't Do" button NOT shown when owner=AI ────────────────────────────────

describe('TicketDetailComponent — "Won\'t Do" hidden when owner=AI', () => {
  it('does not render the "Wird nicht gemacht" button when ticket.owner is AI', async () => {
    const aiTicket = makeTicket({ owner: 'AI', status: 'ON_HOLD' });
    const mockService = makeMockTicketService();
    mockService.getById.and.returnValue(of(aiTicket));

    await TestBed.configureTestingModule({
      imports: [TicketDetailComponent],
      providers: [
        provideRouter([]),
        { provide: TicketService, useValue: mockService },
        { provide: NotificationService, useValue: makeMockNotification() },
        { provide: NgbModal, useValue: makeModalStub() },
        { provide: ActivatedRoute, useValue: makeRoute('10') },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(TicketDetailComponent);
    fixture.detectChanges();

    const text: string = fixture.nativeElement.textContent;
    expect(text).not.toContain('Wird nicht gemacht');
  });

  it('does not render the "Wird nicht gemacht" button when status is already DONE', async () => {
    const doneTicket = makeTicket({ owner: 'HUMAN', status: 'DONE', solution: 'DONE' });
    const mockService = makeMockTicketService();
    mockService.getById.and.returnValue(of(doneTicket));

    await TestBed.configureTestingModule({
      imports: [TicketDetailComponent],
      providers: [
        provideRouter([]),
        { provide: TicketService, useValue: mockService },
        { provide: NotificationService, useValue: makeMockNotification() },
        { provide: NgbModal, useValue: makeModalStub() },
        { provide: ActivatedRoute, useValue: makeRoute('10') },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(TicketDetailComponent);
    fixture.detectChanges();

    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('button');
    const wontDoBtn = Array.from(buttons).find((b) =>
      b.textContent?.trim().includes('Wird nicht gemacht'),
    );
    expect(wontDoBtn).toBeUndefined();
  });
});

// ─── Owner toggle ─────────────────────────────────────────────────────────────

describe('TicketDetailComponent — toggleOwner()', () => {
  let fixture: ComponentFixture<TicketDetailComponent>;
  let component: TicketDetailComponent;
  let mockService: jasmine.SpyObj<TicketService>;

  const humanTicket = makeTicket({ owner: 'HUMAN' });

  beforeEach(async () => {
    mockService = makeMockTicketService();
    mockService.getById.and.returnValue(of(humanTicket));
    mockService.setOwner.and.returnValue(of({ ...humanTicket, owner: 'AI' }));
    // humanTicket has status ON_HOLD, so handing it to the AI also resets the
    // status to TODO via setStatus(); the final ticket comes from this call.
    mockService.setStatus.and.returnValue(of({ ...humanTicket, owner: 'AI', status: 'TODO' }));

    await TestBed.configureTestingModule({
      imports: [TicketDetailComponent],
      providers: [
        provideRouter([]),
        { provide: TicketService, useValue: mockService },
        { provide: NotificationService, useValue: makeMockNotification() },
        { provide: NgbModal, useValue: makeModalStub() },
        { provide: ActivatedRoute, useValue: makeRoute('10') },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TicketDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('calls setOwner() with AI when current owner is HUMAN', fakeAsync(() => {
    component.toggleOwner();
    tick();

    expect(mockService.setOwner).toHaveBeenCalledWith(10, 'AI');
  }));

  it('updates the ticket owner after setOwner() succeeds', fakeAsync(() => {
    component.toggleOwner();
    tick();

    expect(component.ticket?.owner).toBe('AI');
  }));

  it('calls setOwner() with HUMAN when current owner is AI', fakeAsync(() => {
    const aiTicket = makeTicket({ owner: 'AI' });
    mockService.getById.and.returnValue(of(aiTicket));
    mockService.setOwner.and.returnValue(of({ ...aiTicket, owner: 'HUMAN' }));

    const fixture2 = TestBed.createComponent(TicketDetailComponent);
    fixture2.detectChanges();
    const comp2 = fixture2.componentInstance;

    comp2.toggleOwner();
    tick();

    expect(mockService.setOwner).toHaveBeenCalledWith(10, 'HUMAN');
  }));

  it('renders "An KI übergeben" button text when owner is HUMAN', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('An KI übergeben');
  });
});

// ─── DEFINITION status — Definition actions ──────────────────────────────────

describe('TicketDetailComponent — DEFINITION status actions', () => {
  let fixture: ComponentFixture<TicketDetailComponent>;
  let component: TicketDetailComponent;
  let mockService: jasmine.SpyObj<TicketService>;
  let mockNotification: jasmine.SpyObj<NotificationService>;

  const definitionTicket = makeTicket({ owner: 'HUMAN', status: 'DEFINITION' });

  function findButtonByText(text: string): HTMLButtonElement | undefined {
    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('button');
    return Array.from(buttons).find((b) => b.textContent?.includes(text));
  }

  beforeEach(async () => {
    mockService = makeMockTicketService();
    mockNotification = makeMockNotification();
    mockService.getById.and.returnValue(of(definitionTicket));
    mockService.handToAi.and.returnValue(
      of({ ...definitionTicket, owner: 'AI', status: 'TODO' }),
    );
    mockService.setStatus.and.returnValue(of({ ...definitionTicket, status: 'TODO' }));

    await TestBed.configureTestingModule({
      imports: [TicketDetailComponent],
      providers: [
        provideRouter([]),
        { provide: TicketService, useValue: mockService },
        { provide: NotificationService, useValue: mockNotification },
        { provide: NgbModal, useValue: makeModalStub() },
        { provide: ActivatedRoute, useValue: makeRoute('10') },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TicketDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the "An KI übergeben" Definition button', () => {
    expect(findButtonByText('An KI übergeben')).toBeTruthy();
  });

  it('renders the "Nach Bereit" button', () => {
    expect(findButtonByText('Nach Bereit')).toBeTruthy();
  });

  it('hides the generic owner-toggle button while status is DEFINITION', () => {
    // Only one button should reference "An KI übergeben" — the Definition action,
    // not the generic owner-toggle (which also uses that label for HUMAN owners).
    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('button');
    const matches = Array.from(buttons).filter((b) => b.textContent?.includes('An KI übergeben'));
    expect(matches.length).toBe(1);
  });

  it('does not render the "Eigentümer ändern" label used by the generic owner-toggle', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).not.toContain('Eigentümer ändern');
  });

  it('shows "Definition" as the status label via statusLabel()', () => {
    expect(component.statusLabel('DEFINITION')).toBe('Definition');
  });

  it('renders the "Definition" status badge in the DOM', () => {
    const badge: HTMLElement = fixture.nativeElement.querySelector('.bg-info.text-dark');
    expect(badge).toBeTruthy();
    expect(badge.textContent?.trim()).toBe('Definition');
  });

  it('calls ticketService.handToAi with the ticket id when "An KI übergeben" is clicked', fakeAsync(() => {
    findButtonByText('An KI übergeben')!.click();
    tick();

    expect(mockService.handToAi).toHaveBeenCalledWith(10);
  }));

  it('updates the ticket after handToAi() succeeds', fakeAsync(() => {
    findButtonByText('An KI übergeben')!.click();
    tick();

    expect(component.ticket?.owner).toBe('AI');
    expect(component.ticket?.status).toBe('TODO');
  }));

  it('calls ticketService.setStatus with (id, "TODO") when "Nach Bereit" is clicked', fakeAsync(() => {
    findButtonByText('Nach Bereit')!.click();
    tick();

    expect(mockService.setStatus).toHaveBeenCalledWith(10, 'TODO');
  }));

  it('updates the ticket after moveToReady() (Nach Bereit) succeeds', fakeAsync(() => {
    findButtonByText('Nach Bereit')!.click();
    tick();

    expect(component.ticket?.status).toBe('TODO');
  }));

  it('disables both Definition buttons while handToAi() is in flight', fakeAsync(() => {
    const handToAi$ = new Subject<Ticket>();
    mockService.handToAi.and.returnValue(handToAi$);

    findButtonByText('An KI übergeben')!.click();
    fixture.detectChanges();

    expect(findButtonByText('An KI übergeben')!.disabled).toBeTrue();
    expect(findButtonByText('Nach Bereit')!.disabled).toBeTrue();

    handToAi$.next({ ...definitionTicket, owner: 'AI', status: 'TODO' });
    handToAi$.complete();
    tick();
  }));

  it('resets savingHandToAi and notifies an error when handToAi() fails', fakeAsync(() => {
    mockService.handToAi.and.returnValue(throwError(() => new Error('Server error')));

    findButtonByText('An KI übergeben')!.click();
    tick();

    expect(component.savingHandToAi).toBeFalse();
    expect(mockNotification.error).toHaveBeenCalledWith(
      'Fehler beim Übergeben des Tickets an die KI.',
    );
  }));

  it('resets savingMoveToReady and notifies an error when setStatus() fails for "Nach Bereit"', fakeAsync(() => {
    mockService.setStatus.and.returnValue(throwError(() => new Error('Server error')));

    findButtonByText('Nach Bereit')!.click();
    tick();

    expect(component.savingMoveToReady).toBeFalse();
    expect(mockNotification.error).toHaveBeenCalledWith(
      'Fehler beim Verschieben des Tickets.',
    );
  }));
});

// ─── Non-DEFINITION ticket — Definition actions absent ───────────────────────

describe('TicketDetailComponent — Definition actions absent for non-DEFINITION ticket', () => {
  it('does not render "An KI übergeben" Definition button or "Nach Bereit" button for a TODO ticket', async () => {
    const todoTicket = makeTicket({ owner: 'HUMAN', status: 'TODO' });
    const mockService = makeMockTicketService();
    mockService.getById.and.returnValue(of(todoTicket));

    await TestBed.configureTestingModule({
      imports: [TicketDetailComponent],
      providers: [
        provideRouter([]),
        { provide: TicketService, useValue: mockService },
        { provide: NotificationService, useValue: makeMockNotification() },
        { provide: NgbModal, useValue: makeModalStub() },
        { provide: ActivatedRoute, useValue: makeRoute('10') },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(TicketDetailComponent);
    fixture.detectChanges();

    const text: string = fixture.nativeElement.textContent;
    expect(text).not.toContain('Nach Bereit');

    // The generic owner-toggle button IS shown (status !== DEFINITION), and it also
    // reads "An KI übergeben" for a HUMAN owner — so there should be exactly one match,
    // coming from the generic toggle, not the Definition action group.
    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('button');
    const matches = Array.from(buttons).filter((b) => b.textContent?.includes('An KI übergeben'));
    expect(matches.length).toBe(1);
  });

  it('shows the generic "Eigentümer ändern" owner-toggle for a non-DEFINITION ticket', async () => {
    const todoTicket = makeTicket({ owner: 'HUMAN', status: 'TODO' });
    const mockService = makeMockTicketService();
    mockService.getById.and.returnValue(of(todoTicket));

    await TestBed.configureTestingModule({
      imports: [TicketDetailComponent],
      providers: [
        provideRouter([]),
        { provide: TicketService, useValue: mockService },
        { provide: NotificationService, useValue: makeMockNotification() },
        { provide: NgbModal, useValue: makeModalStub() },
        { provide: ActivatedRoute, useValue: makeRoute('10') },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(TicketDetailComponent);
    fixture.detectChanges();

    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Eigentümer ändern');
  });
});

// ─── Badge helper methods ─────────────────────────────────────────────────────

describe('TicketDetailComponent — badge helper methods', () => {
  let component: TicketDetailComponent;

  beforeEach(async () => {
    const mockService = makeMockTicketService();
    mockService.getById.and.returnValue(of(MOCK_TICKET));

    await TestBed.configureTestingModule({
      imports: [TicketDetailComponent],
      providers: [
        provideRouter([]),
        { provide: TicketService, useValue: mockService },
        { provide: NotificationService, useValue: makeMockNotification() },
        { provide: NgbModal, useValue: makeModalStub() },
        { provide: ActivatedRoute, useValue: makeRoute('10') },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(TicketDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('statusBadgeClass returns "badge bg-primary" for TODO', () => {
    expect(component.statusBadgeClass('TODO')).toBe('badge bg-primary');
  });

  it('statusBadgeClass returns "badge bg-warning text-dark" for IN_PROGRESS', () => {
    expect(component.statusBadgeClass('IN_PROGRESS')).toBe('badge bg-warning text-dark');
  });

  it('statusBadgeClass returns "badge bg-secondary" for ON_HOLD', () => {
    expect(component.statusBadgeClass('ON_HOLD')).toBe('badge bg-secondary');
  });

  it('statusBadgeClass returns "badge bg-success" for DONE', () => {
    expect(component.statusBadgeClass('DONE')).toBe('badge bg-success');
  });

  it('ownerBadgeClass returns "badge badge-owner-ai" for AI', () => {
    expect(component.ownerBadgeClass('AI')).toBe('badge badge-owner-ai');
  });

  it('ownerBadgeClass returns "badge badge-owner-human" for HUMAN', () => {
    expect(component.ownerBadgeClass('HUMAN')).toBe('badge badge-owner-human');
  });

  it('solutionBadgeClass returns "badge badge-solution-done" for DONE', () => {
    expect(component.solutionBadgeClass('DONE')).toBe('badge badge-solution-done');
  });

  it('solutionBadgeClass returns "badge badge-solution-wontdo" for WONT_DO', () => {
    expect(component.solutionBadgeClass('WONT_DO')).toBe('badge badge-solution-wontdo');
  });
});
