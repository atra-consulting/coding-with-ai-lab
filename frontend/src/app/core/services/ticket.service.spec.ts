import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TicketService } from './ticket.service';
import { Ticket, TicketBoard, TicketComment, TicketSummary } from '../models/ticket.model';
import { Page } from '../models/page.model';

// ─── Shared test data ─────────────────────────────────────────────────────────

const MOCK_COMMENT: TicketComment = {
  id: 1,
  ticketId: 10,
  author: 'AGENT',
  authorName: 'Claude Code',
  body: 'Rückfrage: Welches Format soll der Export haben?',
  createdAt: '2024-06-01T08:00:00.000Z',
};

const MOCK_TICKET: Ticket = {
  id: 10,
  owner: 'AI',
  type: 'FEATURE',
  title: 'CSV-Export für Firmenliste',
  body: 'Bitte einen CSV-Export der Firmen implementieren.',
  status: 'TODO',
  solution: null,
  commentCount: 1,
  comments: [MOCK_COMMENT],
  pickedUpAt: null,
  resolvedAt: null,
  createdAt: '2024-06-01T07:00:00.000Z',
  updatedAt: '2024-06-01T07:00:00.000Z',
};

const MOCK_BOARD: TicketBoard = {
  TODO: [MOCK_TICKET],
  IN_PROGRESS: [],
  ON_HOLD: [],
  DONE: [],
};

const MOCK_SUMMARY: TicketSummary = {
  byStatus: { TODO: 9, IN_PROGRESS: 0, ON_HOLD: 3, DONE: 0 },
  byType: { FEATURE: 9, BUG: 1, CHORE: 2 },
  byOwner: { AI: 9, HUMAN: 3 },
  bySolution: { DONE: 0, WONT_DO: 0 },
};

const MOCK_PAGE: Page<Ticket> = {
  content: [MOCK_TICKET],
  totalElements: 1,
  totalPages: 1,
  size: 20,
  number: 0,
  first: true,
  last: true,
};

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('TicketService', () => {
  let service: TicketService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(TicketService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ─── getBoard() ────────────────────────────────────────────────────────────

  describe('getBoard()', () => {
    it('fires GET to /api/tickets/board', () => {
      service.getBoard().subscribe();

      const req = httpMock.expectOne('/api/tickets/board');
      expect(req.request.method).toBe('GET');
      req.flush(MOCK_BOARD);
    });

    it('emits the board response from the server', () => {
      let received: TicketBoard | undefined;
      service.getBoard().subscribe((r) => (received = r));

      httpMock.expectOne('/api/tickets/board').flush(MOCK_BOARD);

      expect(received).toEqual(MOCK_BOARD);
    });
  });

  // ─── getSummary() ──────────────────────────────────────────────────────────

  describe('getSummary()', () => {
    it('fires GET to /api/tickets/summary', () => {
      service.getSummary().subscribe();

      const req = httpMock.expectOne('/api/tickets/summary');
      expect(req.request.method).toBe('GET');
      req.flush(MOCK_SUMMARY);
    });

    it('emits the summary returned by the server', () => {
      let received: TicketSummary | undefined;
      service.getSummary().subscribe((r) => (received = r));

      httpMock.expectOne('/api/tickets/summary').flush(MOCK_SUMMARY);

      expect(received).toEqual(MOCK_SUMMARY);
    });
  });

  // ─── getById() ─────────────────────────────────────────────────────────────

  describe('getById()', () => {
    it('fires GET to /api/tickets/:id', () => {
      service.getById(10).subscribe();

      const req = httpMock.expectOne('/api/tickets/10');
      expect(req.request.method).toBe('GET');
      req.flush(MOCK_TICKET);
    });

    it('emits the ticket returned by the server', () => {
      let received: Ticket | undefined;
      service.getById(10).subscribe((r) => (received = r));

      httpMock.expectOne('/api/tickets/10').flush(MOCK_TICKET);

      expect(received).toEqual(MOCK_TICKET);
    });
  });

  // ─── getAll() ──────────────────────────────────────────────────────────────

  describe('getAll()', () => {
    it('fires GET to /api/tickets with default params', () => {
      service.getAll().subscribe();

      const req = httpMock.expectOne(
        (r) => r.url === '/api/tickets' && r.method === 'GET',
      );
      expect(req.request.params.get('page')).toBe('0');
      expect(req.request.params.get('size')).toBe('20');
      expect(req.request.params.get('sort')).toBe('createdAt,desc');
      req.flush(MOCK_PAGE);
    });

    it('passes provided page and size to query params', () => {
      service.getAll(2, 50, 'createdAt,asc').subscribe();

      const req = httpMock.expectOne(
        (r) => r.url === '/api/tickets' && r.method === 'GET',
      );
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('size')).toBe('50');
      expect(req.request.params.get('sort')).toBe('createdAt,asc');
      req.flush(MOCK_PAGE);
    });

    it('adds type filter param when provided', () => {
      service.getAll(0, 20, 'createdAt,desc', { type: 'FEATURE' }).subscribe();

      const req = httpMock.expectOne(
        (r) => r.url === '/api/tickets' && r.method === 'GET',
      );
      expect(req.request.params.get('type')).toBe('FEATURE');
      req.flush(MOCK_PAGE);
    });

    it('adds status filter param when provided', () => {
      service.getAll(0, 20, 'createdAt,desc', { status: 'TODO' }).subscribe();

      const req = httpMock.expectOne(
        (r) => r.url === '/api/tickets' && r.method === 'GET',
      );
      expect(req.request.params.get('status')).toBe('TODO');
      req.flush(MOCK_PAGE);
    });

    it('adds owner filter param when provided', () => {
      service.getAll(0, 20, 'createdAt,desc', { owner: 'AI' }).subscribe();

      const req = httpMock.expectOne(
        (r) => r.url === '/api/tickets' && r.method === 'GET',
      );
      expect(req.request.params.get('owner')).toBe('AI');
      req.flush(MOCK_PAGE);
    });

    it('omits optional filter params when not provided', () => {
      service.getAll().subscribe();

      const req = httpMock.expectOne(
        (r) => r.url === '/api/tickets' && r.method === 'GET',
      );
      expect(req.request.params.has('type')).toBeFalse();
      expect(req.request.params.has('status')).toBeFalse();
      expect(req.request.params.has('owner')).toBeFalse();
      req.flush(MOCK_PAGE);
    });

    it('emits the server page response', () => {
      let received: Page<Ticket> | undefined;
      service.getAll().subscribe((r) => (received = r));

      httpMock.expectOne((r) => r.url === '/api/tickets').flush(MOCK_PAGE);

      expect(received).toEqual(MOCK_PAGE);
    });
  });

  // ─── create() ──────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('fires POST to /api/tickets', () => {
      service.create({ type: 'FEATURE', title: 'Neues Feature', body: 'Beschreibung' }).subscribe();

      const req = httpMock.expectOne('/api/tickets');
      expect(req.request.method).toBe('POST');
      req.flush(MOCK_TICKET);
    });

    it('sends type, title, and body in the request body', () => {
      const dto = { type: 'BUG' as const, title: 'Ein Bug', body: 'Bug-Beschreibung' };
      service.create(dto).subscribe();

      const req = httpMock.expectOne('/api/tickets');
      expect(req.request.body).toEqual(dto);
      req.flush({ ...MOCK_TICKET, ...dto });
    });

    it('emits the created ticket from the server', () => {
      let received: Ticket | undefined;
      service.create({ type: 'FEATURE', title: 'Test', body: 'Body' }).subscribe(
        (r) => (received = r),
      );

      httpMock.expectOne('/api/tickets').flush(MOCK_TICKET);

      expect(received).toEqual(MOCK_TICKET);
    });
  });

  // ─── setStatus() ───────────────────────────────────────────────────────────

  describe('setStatus()', () => {
    it('fires PATCH to /api/tickets/:id/status', () => {
      service.setStatus(10, 'IN_PROGRESS').subscribe();

      const req = httpMock.expectOne('/api/tickets/10/status');
      expect(req.request.method).toBe('PATCH');
      req.flush(MOCK_TICKET);
    });

    it('sends { status } in the request body', () => {
      service.setStatus(10, 'IN_PROGRESS').subscribe();

      const req = httpMock.expectOne('/api/tickets/10/status');
      expect(req.request.body).toEqual({ status: 'IN_PROGRESS' });
      req.flush(MOCK_TICKET);
    });

    it('emits the updated ticket from the server', () => {
      let received: Ticket | undefined;
      service.setStatus(10, 'DONE').subscribe((r) => (received = r));

      httpMock.expectOne('/api/tickets/10/status').flush({
        ...MOCK_TICKET,
        status: 'DONE',
        solution: 'DONE',
      });

      expect(received?.status).toBe('DONE');
    });
  });

  // ─── setOwner() ────────────────────────────────────────────────────────────

  describe('setOwner()', () => {
    it('fires PATCH to /api/tickets/:id/owner', () => {
      service.setOwner(10, 'HUMAN').subscribe();

      const req = httpMock.expectOne('/api/tickets/10/owner');
      expect(req.request.method).toBe('PATCH');
      req.flush(MOCK_TICKET);
    });

    it('sends { owner } in the request body', () => {
      service.setOwner(10, 'HUMAN').subscribe();

      const req = httpMock.expectOne('/api/tickets/10/owner');
      expect(req.request.body).toEqual({ owner: 'HUMAN' });
      req.flush(MOCK_TICKET);
    });

    it('emits the updated ticket from the server', () => {
      let received: Ticket | undefined;
      service.setOwner(10, 'HUMAN').subscribe((r) => (received = r));

      httpMock.expectOne('/api/tickets/10/owner').flush({
        ...MOCK_TICKET,
        owner: 'HUMAN',
      });

      expect(received?.owner).toBe('HUMAN');
    });
  });

  // ─── wontDo() ──────────────────────────────────────────────────────────────

  describe('wontDo()', () => {
    it('fires POST to /api/tickets/:id/wont-do', () => {
      service.wontDo(10).subscribe();

      const req = httpMock.expectOne('/api/tickets/10/wont-do');
      expect(req.request.method).toBe('POST');
      req.flush(MOCK_TICKET);
    });

    it('sends { comment } in the request body (comment undefined → still sends key)', () => {
      service.wontDo(10).subscribe();

      const req = httpMock.expectOne('/api/tickets/10/wont-do');
      // The service always sends the comment key (value may be undefined)
      expect(req.request.body).toEqual({ comment: undefined });
      req.flush(MOCK_TICKET);
    });

    it('sends the optional comment string when provided', () => {
      service.wontDo(10, 'Wird nicht umgesetzt.').subscribe();

      const req = httpMock.expectOne('/api/tickets/10/wont-do');
      expect(req.request.body).toEqual({ comment: 'Wird nicht umgesetzt.' });
      req.flush(MOCK_TICKET);
    });

    it('emits the updated ticket from the server', () => {
      let received: Ticket | undefined;
      service.wontDo(10).subscribe((r) => (received = r));

      httpMock.expectOne('/api/tickets/10/wont-do').flush({
        ...MOCK_TICKET,
        status: 'DONE',
        solution: 'WONT_DO',
      });

      expect(received?.solution).toBe('WONT_DO');
    });
  });

  // ─── addComment() ──────────────────────────────────────────────────────────

  describe('addComment()', () => {
    it('fires POST to /api/tickets/:id/comments', () => {
      service.addComment(10, { body: 'Antwort', handBackToAi: false }).subscribe();

      const req = httpMock.expectOne('/api/tickets/10/comments');
      expect(req.request.method).toBe('POST');
      req.flush(MOCK_TICKET);
    });

    it('sends { body, handBackToAi } in the request body', () => {
      service.addComment(10, { body: 'Antwort', handBackToAi: true }).subscribe();

      const req = httpMock.expectOne('/api/tickets/10/comments');
      expect(req.request.body).toEqual({ body: 'Antwort', handBackToAi: true });
      req.flush(MOCK_TICKET);
    });

    it('sends body only (no handBackToAi) when not providing the flag', () => {
      service.addComment(10, { body: 'Kommentar' }).subscribe();

      const req = httpMock.expectOne('/api/tickets/10/comments');
      expect(req.request.body).toEqual({ body: 'Kommentar' });
      req.flush(MOCK_TICKET);
    });

    it('emits the updated ticket from the server', () => {
      let received: Ticket | undefined;
      service.addComment(10, { body: 'Antwort', handBackToAi: false }).subscribe(
        (r) => (received = r),
      );

      httpMock.expectOne('/api/tickets/10/comments').flush(MOCK_TICKET);

      expect(received).toEqual(MOCK_TICKET);
    });
  });
});
