import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { CronService } from './cron.service';
import { CronJob, CronRun, CronJobLastRun } from '../models/cron.model';
import { Page } from '../models/page.model';

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

const makeRun = (id = 1): CronRun => ({
  id,
  job: 'agent-tasks',
  status: 'SUCCESS',
  trigger: 'CRON',
  startedAt: '2024-06-01T08:00:00.000Z',
  finishedAt: '2024-06-01T08:05:00.000Z',
  durationMs: 300000,
  result: 'Processed 5 tasks',
  githubRunUrl: 'https://github.com/org/repo/actions/runs/12345',
  error: null,
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

describe('CronService', () => {
  let service: CronService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(CronService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getJobs()', () => {
    it('fires GET to /api/cron/jobs', () => {
      service.getJobs().subscribe();

      const req = httpMock.expectOne('/api/cron/jobs');
      expect(req.request.method).toBe('GET');
      req.flush([makeJob()]);
    });

    it('emits the array of jobs returned by the server', () => {
      const mockJobs = [makeJob('agent-tasks'), makeJob('cleanup')];
      let received: CronJob[] | undefined;

      service.getJobs().subscribe((r) => (received = r));

      httpMock.expectOne('/api/cron/jobs').flush(mockJobs);

      expect(received).toEqual(mockJobs);
    });
  });

  describe('getRuns() — without job filter', () => {
    it('fires GET to /api/cron/runs', () => {
      service.getRuns().subscribe();

      const req = httpMock.expectOne(
        (r) => r.url === '/api/cron/runs' && r.method === 'GET',
      );
      expect(req.request.method).toBe('GET');
      req.flush(makeRunsPage([]));
    });

    it('sends page=0 and size=20 as default query params', () => {
      service.getRuns().subscribe();

      const req = httpMock.expectOne((r) => r.url === '/api/cron/runs');
      expect(req.request.params.get('page')).toBe('0');
      expect(req.request.params.get('size')).toBe('20');
      req.flush(makeRunsPage([]));
    });

    it('omits the job query param when job is not provided', () => {
      service.getRuns(0, 20).subscribe();

      const req = httpMock.expectOne((r) => r.url === '/api/cron/runs');
      expect(req.request.params.has('job')).toBeFalse();
      req.flush(makeRunsPage([]));
    });

    it('sends the provided page and size', () => {
      service.getRuns(3, 10).subscribe();

      const req = httpMock.expectOne((r) => r.url === '/api/cron/runs');
      expect(req.request.params.get('page')).toBe('3');
      expect(req.request.params.get('size')).toBe('10');
      req.flush(makeRunsPage([]));
    });

    it('emits the page of runs returned by the server', () => {
      const mockPage = makeRunsPage([makeRun(1), makeRun(2)]);
      let received: Page<CronRun> | undefined;

      service.getRuns().subscribe((r) => (received = r));

      httpMock.expectOne((r) => r.url === '/api/cron/runs').flush(mockPage);

      expect(received).toEqual(mockPage);
    });
  });

  describe('getRuns() — with job filter', () => {
    it('includes the job query param when job is provided', () => {
      service.getRuns(0, 20, 'agent-tasks').subscribe();

      const req = httpMock.expectOne((r) => r.url === '/api/cron/runs');
      expect(req.request.params.get('job')).toBe('agent-tasks');
      req.flush(makeRunsPage([]));
    });

    it('sends page, size, and job together when all are provided', () => {
      service.getRuns(1, 10, 'cleanup').subscribe();

      const req = httpMock.expectOne((r) => r.url === '/api/cron/runs');
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('size')).toBe('10');
      expect(req.request.params.get('job')).toBe('cleanup');
      req.flush(makeRunsPage([]));
    });
  });

  describe('triggerNow()', () => {
    it('fires GET to /api/cron/agent-tasks', () => {
      service.triggerNow().subscribe();

      const req = httpMock.expectOne('/api/cron/agent-tasks');
      expect(req.request.method).toBe('GET');
      req.flush(makeRun(99));
    });

    it('emits the CronRun returned by the server', () => {
      const mockRun = makeRun(99);
      let received: CronRun | undefined;

      service.triggerNow().subscribe((r) => (received = r));

      httpMock.expectOne('/api/cron/agent-tasks').flush(mockRun);

      expect(received).toEqual(mockRun);
    });
  });

  describe('setJobEnabled()', () => {
    it('fires PATCH to /api/cron/jobs/solve-tasks with body { enabled: false }', () => {
      service.setJobEnabled('solve-tasks', false).subscribe();

      const req = httpMock.expectOne('/api/cron/jobs/solve-tasks');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ enabled: false });
      req.flush(makeJob('solve-tasks', false));
    });

    it('emits the updated CronJob returned by the server', () => {
      const updatedJob = makeJob('solve-tasks', false);
      let received: CronJob | undefined;

      service.setJobEnabled('solve-tasks', false).subscribe((r) => (received = r));

      httpMock.expectOne('/api/cron/jobs/solve-tasks').flush(updatedJob);

      expect(received).toEqual(updatedJob);
    });
  });
});
