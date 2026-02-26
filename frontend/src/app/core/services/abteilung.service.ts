import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Abteilung, AbteilungCreate } from '../models/abteilung.model';
import { Page } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class AbteilungService {
  private http = inject(HttpClient);
  private baseUrl = '/api/abteilungen';

  getAll(page = 0, size = 10, sort = 'name,asc'): Observable<Page<Abteilung>> {
    const params = new HttpParams().set('page', page).set('size', size).set('sort', sort);
    return this.http.get<Page<Abteilung>>(this.baseUrl, { params });
  }

  getById(id: number): Observable<Abteilung> {
    return this.http.get<Abteilung>(`${this.baseUrl}/${id}`);
  }

  create(abteilung: AbteilungCreate): Observable<Abteilung> {
    return this.http.post<Abteilung>(this.baseUrl, abteilung);
  }

  update(id: number, abteilung: AbteilungCreate): Observable<Abteilung> {
    return this.http.put<Abteilung>(`${this.baseUrl}/${id}`, abteilung);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getAllByFirmaId(firmaId: number): Observable<Abteilung[]> {
    return this.http.get<Abteilung[]>(`${this.baseUrl}/firma/${firmaId}`);
  }
}
