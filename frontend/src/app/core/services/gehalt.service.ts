import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Gehalt, GehaltCreate } from '../models/gehalt.model';
import { Page } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class GehaltService {
  private http = inject(HttpClient);
  private baseUrl = '/api/gehaelter';

  getAll(page = 0, size = 10, sort = 'effectiveDate,desc'): Observable<Page<Gehalt>> {
    const params = new HttpParams().set('page', page).set('size', size).set('sort', sort);
    return this.http.get<Page<Gehalt>>(this.baseUrl, { params });
  }

  getById(id: number): Observable<Gehalt> {
    return this.http.get<Gehalt>(`${this.baseUrl}/${id}`);
  }

  create(gehalt: GehaltCreate): Observable<Gehalt> {
    return this.http.post<Gehalt>(this.baseUrl, gehalt);
  }

  update(id: number, gehalt: GehaltCreate): Observable<Gehalt> {
    return this.http.put<Gehalt>(`${this.baseUrl}/${id}`, gehalt);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
