import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Adresse, AdresseCreate } from '../models/adresse.model';
import { Page } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class AdresseService {
  private http = inject(HttpClient);
  private baseUrl = '/api/adressen';

  getAll(page = 0, size = 10, sort = 'city,asc'): Observable<Page<Adresse>> {
    const params = new HttpParams().set('page', page).set('size', size).set('sort', sort);
    return this.http.get<Page<Adresse>>(this.baseUrl, { params });
  }

  getById(id: number): Observable<Adresse> {
    return this.http.get<Adresse>(`${this.baseUrl}/${id}`);
  }

  create(adresse: AdresseCreate): Observable<Adresse> {
    return this.http.post<Adresse>(this.baseUrl, adresse);
  }

  update(id: number, adresse: AdresseCreate): Observable<Adresse> {
    return this.http.put<Adresse>(`${this.baseUrl}/${id}`, adresse);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
