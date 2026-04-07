import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Page } from '../models/page.model';
import { Produkt, ProduktCreate } from '../models/produkt.model';

@Injectable({ providedIn: 'root' })
export class ProduktService {
  private http = inject(HttpClient);
  private baseUrl = '/api/produkte';

  getAll(page = 0, size = 10, sort = 'name,asc'): Observable<Page<Produkt>> {
    const params = new HttpParams().set('page', page).set('size', size).set('sort', sort);
    return this.http.get<Page<Produkt>>(this.baseUrl, { params });
  }

  listAll(): Observable<Produkt[]> {
    return this.http.get<Produkt[]>(`${this.baseUrl}/all`);
  }

  getById(id: number): Observable<Produkt> {
    return this.http.get<Produkt>(`${this.baseUrl}/${id}`);
  }

  create(produkt: ProduktCreate): Observable<Produkt> {
    return this.http.post<Produkt>(this.baseUrl, produkt);
  }

  update(id: number, produkt: ProduktCreate): Observable<Produkt> {
    return this.http.put<Produkt>(`${this.baseUrl}/${id}`, produkt);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
