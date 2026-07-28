import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AgentTaskService } from './agent-task.service';
import { AgentTask, AgentTaskSummary } from '../models/agent-task.model';
import { Page } from '../models/page.model';

describe('AgentTaskService', () => {
  let service: AgentTaskService;
  let httpMock: HttpTestingController;

  const mockTask: AgentTask = {
    id: 1,
    source: 'EMAIL',
    title: 'Show company phone in list view',
    body: 'The phone number is stored but not shown in the company list table.',
    status: 'OPEN',
    comment: null,
    metadata: null,
    pickedUpAt: null,
    resolvedAt: null,
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-01-01T10:00:00.000Z',
  };

  const mockPage: Page<AgentTask> = {
    content: [mockTask],
    totalElements: 1,
    totalPages: 1,
    size: 10,
    number: 0,
    first: true,
    last: true,
  };

  const mockSummaries: AgentTaskSummary[] = [
    { source: 'EMAIL', openCount: 2, inProgressCount: 1, doneCount: 1, rejectedCount: 0 },
    { source: 'GITHUB_ISSUE', openCount: 3, inProgressCount: 0, doneCount: 1, rejectedCount: 0 },
    { source: 'APP_LOG', openCount: 1, inProgressCount: 0, doneCount: 2, rejectedCount: 1 },
    { source: 'ERROR_REPORT', openCount: 0, inProgressCount: 0, doneCount: 2, rejectedCount: 2 },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AgentTaskService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getAll()', () => {
    it('fires GET to /api/agent-tasks with default params', () => {
      service.getAll().subscribe();

      const req = httpMock.expectOne(
        (r) => r.url === '/api/agent-tasks' && r.method === 'GET',
      );
      expect(req.request.params.get('page')).toBe('0');
      expect(req.request.params.get('size')).toBe('10');
      expect(req.request.params.get('sort')).toBe('createdAt,desc');
      req.flush(mockPage);
    });

    it('passes the provided page and size to query params', () => {
      service.getAll(2, 20, 'createdAt,desc').subscribe();

      const req = httpMock.expectOne(
        (r) => r.url === '/api/agent-tasks' && r.method === 'GET',
      );
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('size')).toBe('20');
      req.flush(mockPage);
    });

    it('adds source param when source is provided', () => {
      service.getAll(0, 10, 'createdAt,desc', 'EMAIL').subscribe();

      const req = httpMock.expectOne(
        (r) => r.url === '/api/agent-tasks' && r.method === 'GET',
      );
      expect(req.request.params.get('source')).toBe('EMAIL');
      req.flush(mockPage);
    });

    it('adds status param when status is provided', () => {
      service.getAll(0, 10, 'createdAt,desc', undefined, 'OPEN').subscribe();

      const req = httpMock.expectOne(
        (r) => r.url === '/api/agent-tasks' && r.method === 'GET',
      );
      expect(req.request.params.get('status')).toBe('OPEN');
      req.flush(mockPage);
    });

    it('adds both source and status params when both are provided', () => {
      service.getAll(0, 10, 'createdAt,desc', 'GITHUB_ISSUE', 'IN_PROGRESS').subscribe();

      const req = httpMock.expectOne(
        (r) => r.url === '/api/agent-tasks' && r.method === 'GET',
      );
      expect(req.request.params.get('source')).toBe('GITHUB_ISSUE');
      expect(req.request.params.get('status')).toBe('IN_PROGRESS');
      req.flush(mockPage);
    });

    it('omits source param when source is undefined', () => {
      service.getAll(0, 10, 'createdAt,desc', undefined).subscribe();

      const req = httpMock.expectOne(
        (r) => r.url === '/api/agent-tasks' && r.method === 'GET',
      );
      expect(req.request.params.has('source')).toBeFalse();
      req.flush(mockPage);
    });

    it('emits the server page response', () => {
      let received: Page<AgentTask> | undefined;
      service.getAll().subscribe((r) => (received = r));

      httpMock.expectOne((r) => r.url === '/api/agent-tasks').flush(mockPage);

      expect(received).toEqual(mockPage);
    });
  });

  describe('getById()', () => {
    it('fires GET to /api/agent-tasks/:id', () => {
      service.getById(42).subscribe();

      const req = httpMock.expectOne('/api/agent-tasks/42');
      expect(req.request.method).toBe('GET');
      req.flush(mockTask);
    });

    it('emits the task returned by the server', () => {
      let received: AgentTask | undefined;
      service.getById(1).subscribe((r) => (received = r));

      httpMock.expectOne('/api/agent-tasks/1').flush(mockTask);

      expect(received).toEqual(mockTask);
    });
  });

  describe('getSummary()', () => {
    it('fires GET to /api/agent-tasks/summary', () => {
      service.getSummary().subscribe();

      const req = httpMock.expectOne('/api/agent-tasks/summary');
      expect(req.request.method).toBe('GET');
      req.flush(mockSummaries);
    });

    it('emits the summary array returned by the server', () => {
      let received: AgentTaskSummary[] | undefined;
      service.getSummary().subscribe((r) => (received = r));

      httpMock.expectOne('/api/agent-tasks/summary').flush(mockSummaries);

      expect(received).toEqual(mockSummaries);
    });
  });

  describe('resetAll()', () => {
    it('fires POST to /api/agent-tasks/reset', () => {
      service.resetAll().subscribe();

      const req = httpMock.expectOne('/api/agent-tasks/reset');
      expect(req.request.method).toBe('POST');
      req.flush({ reset: 16 });
    });

    it('emits the reset count returned by the server', () => {
      let received: { reset: number } | undefined;
      service.resetAll().subscribe((r) => (received = r));

      httpMock.expectOne('/api/agent-tasks/reset').flush({ reset: 16 });

      expect(received).toEqual({ reset: 16 });
    });
  });
});
