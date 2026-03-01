import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PhaseAggregate, PipelineKpis, TopFirma } from '../models/auswertung.model';

@Injectable({ providedIn: 'root' })
export class AuswertungService {
  private http = inject(HttpClient);
  private baseUrl = '/api/auswertungen';

  getPipelineKpis(): Observable<PipelineKpis> {
    return this.http.get<PipelineKpis>(`${this.baseUrl}/pipeline/kpis`);
  }

  getPhaseAggregates(): Observable<PhaseAggregate[]> {
    return this.http.get<PhaseAggregate[]>(`${this.baseUrl}/pipeline/by-phase`);
  }

  getTopFirmen(limit = 10): Observable<TopFirma[]> {
    const params = new HttpParams().set('limit', limit);
    return this.http.get<TopFirma[]>(`${this.baseUrl}/pipeline/top-firmen`, { params });
  }
}
