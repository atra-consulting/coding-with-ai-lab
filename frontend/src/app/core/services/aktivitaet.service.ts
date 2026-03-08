import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Aktivitaet, AktivitaetCreate } from '../models/aktivitaet.model';
import { Page } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class AktivitaetService {
  private http = inject(HttpClient);
  private baseUrl = '/api/aktivitaeten';

  getAll(page = 0, size = 10, sort = 'datum,desc'): Observable<Page<Aktivitaet>> {
    const params = new HttpParams().set('page', page).set('size', size).set('sort', sort);
    return this.http.get<Page<Aktivitaet>>(this.baseUrl, { params });
  }

  listAll(): Observable<Aktivitaet[]> {
    return this.http.get<Aktivitaet[]>(`${this.baseUrl}/all`);
  }

  getById(id: number): Observable<Aktivitaet> {
    return this.http.get<Aktivitaet>(`${this.baseUrl}/${id}`);
  }

  create(aktivitaet: AktivitaetCreate): Observable<Aktivitaet> {
    return this.http.post<Aktivitaet>(this.baseUrl, aktivitaet);
  }

  update(id: number, aktivitaet: AktivitaetCreate): Observable<Aktivitaet> {
    return this.http.put<Aktivitaet>(`${this.baseUrl}/${id}`, aktivitaet);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
