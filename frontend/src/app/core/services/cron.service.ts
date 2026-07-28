import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CronJob, CronRun } from '../models/cron.model';
import { Page } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class CronService {
  private http = inject(HttpClient);
  private baseUrl = '/api/cron';

  getJobs(): Observable<CronJob[]> {
    return this.http.get<CronJob[]>(`${this.baseUrl}/jobs`);
  }

  getRuns(page = 0, size = 20, job?: string): Observable<Page<CronRun>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);
    if (job) {
      params = params.set('job', job);
    }
    return this.http.get<Page<CronRun>>(`${this.baseUrl}/runs`, { params });
  }

  /**
   * Map a cron job name to its trigger endpoint. Each job dispatches a different
   * GitHub Actions workflow, so they have separate endpoints.
   */
  private static readonly TRIGGER_ENDPOINTS: Record<string, string> = {
    'solve-tasks': '/agent-tasks',
    'solve-github-issues': '/github-issues',
  };

  triggerNow(job = 'solve-tasks'): Observable<CronRun> {
    const path = CronService.TRIGGER_ENDPOINTS[job] ?? '/agent-tasks';
    return this.http.get<CronRun>(`${this.baseUrl}${path}`);
  }
}
