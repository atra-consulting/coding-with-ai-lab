import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReportQuery, ReportResult } from '../models/report.model';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private http = inject(HttpClient);
  private baseUrl = '/api/auswertungen';

  executeReport(query: ReportQuery): Observable<ReportResult> {
    return this.http.post<ReportResult>(`${this.baseUrl}/report`, query);
  }
}
