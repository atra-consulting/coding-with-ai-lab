import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Chance, ChanceCreate } from '../models/chance.model';
import { Page } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class ChanceService {
  private http = inject(HttpClient);
  private baseUrl = '/api/chancen';

  getAll(page = 0, size = 10, sort = 'titel,asc'): Observable<Page<Chance>> {
    const params = new HttpParams().set('page', page).set('size', size).set('sort', sort);
    return this.http.get<Page<Chance>>(this.baseUrl, { params });
  }

  listAll(): Observable<Chance[]> {
    return this.http.get<Chance[]>(`${this.baseUrl}/all`);
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
}
