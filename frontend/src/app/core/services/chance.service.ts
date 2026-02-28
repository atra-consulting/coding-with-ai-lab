import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BoardSummary, Chance, ChanceCreate, ChancePhase } from '../models/chance.model';
import { Page } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class ChanceService {
  private http = inject(HttpClient);
  private baseUrl = '/api/chancen';

  getAll(page = 0, size = 10, sort = 'titel,asc'): Observable<Page<Chance>> {
    const params = new HttpParams().set('page', page).set('size', size).set('sort', sort);
    return this.http.get<Page<Chance>>(this.baseUrl, { params });
  }

  getById(id: number): Observable<Chance> {
    return this.http.get<Chance>(`${this.baseUrl}/${id}`);
  }

  create(chance: ChanceCreate): Observable<Chance> {
    return this.http.post<Chance>(this.baseUrl, chance);
  }

  update(id: number, chance: ChanceCreate): Observable<Chance> {
    return this.http.put<Chance>(`${this.baseUrl}/${id}`, chance);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getByPhase(phase: ChancePhase, page = 0, size = 20, sort = 'wert,desc'): Observable<Page<Chance>> {
    const params = new HttpParams().set('page', page).set('size', size).set('sort', sort);
    return this.http.get<Page<Chance>>(`${this.baseUrl}/phase/${phase}`, { params });
  }

  getBoardSummary(): Observable<BoardSummary[]> {
    return this.http.get<BoardSummary[]>(`${this.baseUrl}/board/summary`);
  }

  updatePhase(id: number, phase: ChancePhase): Observable<Chance> {
    return this.http.put<Chance>(`${this.baseUrl}/${id}/phase`, { phase });
  }
}
