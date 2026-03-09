import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Benutzer, BenutzerCreate } from '../models/benutzer.model';
import { Page } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class BenutzerService {
  private http = inject(HttpClient);
  private baseUrl = '/api/benutzer';

  getAll(page = 0, size = 10, sort = 'benutzername,asc', search = ''): Observable<Page<Benutzer>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', sort)
      .set('search', search);
    return this.http.get<Page<Benutzer>>(this.baseUrl, { params });
  }

  listAll(): Observable<Benutzer[]> {
    return this.http.get<Benutzer[]>(`${this.baseUrl}/all`);
  }

  getById(id: number): Observable<Benutzer> {
    return this.http.get<Benutzer>(`${this.baseUrl}/${id}`);
  }

  create(benutzer: BenutzerCreate): Observable<Benutzer> {
    return this.http.post<Benutzer>(this.baseUrl, benutzer);
  }

  update(id: number, benutzer: BenutzerCreate): Observable<Benutzer> {
    return this.http.put<Benutzer>(`${this.baseUrl}/${id}`, benutzer);
  }

  toggleActive(id: number): Observable<Benutzer> {
    return this.http.patch<Benutzer>(`${this.baseUrl}/${id}/toggle-active`, {});
  }
}
