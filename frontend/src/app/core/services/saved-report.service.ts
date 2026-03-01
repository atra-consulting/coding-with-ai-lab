import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SavedReport, SavedReportCreate } from '../models/report.model';

@Injectable({ providedIn: 'root' })
export class SavedReportService {
  private http = inject(HttpClient);
  private baseUrl = '/api/saved-reports';

  getAll(): Observable<SavedReport[]> {
    return this.http.get<SavedReport[]>(this.baseUrl);
  }

  create(dto: SavedReportCreate): Observable<SavedReport> {
    return this.http.post<SavedReport>(this.baseUrl, dto);
  }

  update(id: number, dto: SavedReportCreate): Observable<SavedReport> {
    return this.http.put<SavedReport>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
