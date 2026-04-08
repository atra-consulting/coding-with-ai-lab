import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Chance, ChanceCreate } from '../models/chance.model';

@Injectable({ providedIn: 'root' })
export class ChanceService {
  private http = inject(HttpClient);
  private baseUrl = '/api/chancen';

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
