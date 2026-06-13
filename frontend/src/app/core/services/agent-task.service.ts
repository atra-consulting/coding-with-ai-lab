import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AgentTask, AgentTaskSource, AgentTaskStatus, AgentTaskSummary } from '../models/agent-task.model';
import { Page } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class AgentTaskService {
  private http = inject(HttpClient);
  private baseUrl = '/api/agent-tasks';

  getAll(
    page = 0,
    size = 10,
    sort = 'createdAt,desc',
    source?: AgentTaskSource,
    status?: AgentTaskStatus,
  ): Observable<Page<AgentTask>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', sort);
    if (source) {
      params = params.set('source', source);
    }
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<Page<AgentTask>>(this.baseUrl, { params });
  }

  getById(id: number): Observable<AgentTask> {
    return this.http.get<AgentTask>(`${this.baseUrl}/${id}`);
  }

  getSummary(): Observable<AgentTaskSummary[]> {
    return this.http.get<AgentTaskSummary[]>(`${this.baseUrl}/summary`);
  }
}
