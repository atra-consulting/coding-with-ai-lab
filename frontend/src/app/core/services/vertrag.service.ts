import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Page } from '../models/page.model';
import { Vertrag, VertragCreate } from '../models/vertrag.model';

@Injectable({ providedIn: 'root' })
export class VertragService {
  private http = inject(HttpClient);
  private baseUrl = '/api/vertraege';

  getAll(page = 0, size = 10, sort = 'titel,asc'): Observable<Page<Vertrag>> {
    const params = new HttpParams().set('page', page).set('size', size).set('sort', sort);
    return this.http.get<Page<Vertrag>>(this.baseUrl, { params });
  }

  listAll(): Observable<Vertrag[]> {
    return this.http.get<Vertrag[]>(`${this.baseUrl}/all`);
  }

  getById(id: number): Observable<Vertrag> {
    return this.http.get<Vertrag>(`${this.baseUrl}/${id}`);
  }

  create(vertrag: VertragCreate): Observable<Vertrag> {
    return this.http.post<Vertrag>(this.baseUrl, vertrag);
  }

  update(id: number, vertrag: VertragCreate): Observable<Vertrag> {
    return this.http.put<Vertrag>(`${this.baseUrl}/${id}`, vertrag);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
