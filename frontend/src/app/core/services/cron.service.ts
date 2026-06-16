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

  triggerNow(): Observable<CronRun> {
    return this.http.get<CronRun>(`${this.baseUrl}/agent-tasks`);
  }
}
