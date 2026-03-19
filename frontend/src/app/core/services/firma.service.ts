import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Abteilung } from '../models/abteilung.model';
import { Adresse } from '../models/adresse.model';
import { Firma, FirmaCreate } from '../models/firma.model';
import { Page } from '../models/page.model';
import { Person } from '../models/person.model';

@Injectable({ providedIn: 'root' })
export class FirmaService {
  private http = inject(HttpClient);
  private baseUrl = '/api/firmen';

  getAll(page = 0, size = 10, sort = 'name,asc', search = ''): Observable<Page<Firma>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', sort)
      .set('search', search);
    return this.http.get<Page<Firma>>(this.baseUrl, { params });
  }

  listAll(): Observable<Firma[]> {
    return this.http.get<Firma[]>(`${this.baseUrl}/all`);
  }

  getById(id: number): Observable<Firma> {
    return this.http.get<Firma>(`${this.baseUrl}/${id}`);
  }

  create(firma: FirmaCreate): Observable<Firma> {
    return this.http.post<Firma>(this.baseUrl, firma);
  }

  update(id: number, firma: FirmaCreate): Observable<Firma> {
    return this.http.put<Firma>(`${this.baseUrl}/${id}`, firma);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getPersonen(id: number, page = 0, size = 10): Observable<Page<Person>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<Page<Person>>(`${this.baseUrl}/${id}/personen`, { params });
  }

  getAbteilungen(id: number, page = 0, size = 10): Observable<Page<Abteilung>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<Page<Abteilung>>(`${this.baseUrl}/${id}/abteilungen`, { params });
  }

  getAdressen(id: number, page = 0, size = 100): Observable<Page<Adresse>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<Page<Adresse>>(`${this.baseUrl}/${id}/adressen`, { params });
  }
}
