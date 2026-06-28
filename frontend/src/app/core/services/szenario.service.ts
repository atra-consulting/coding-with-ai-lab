import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Szenario, SzenarioCreate, SzenarioUpdate } from '../models/szenario.model';

@Injectable({ providedIn: 'root' })
export class SzenarioService {
  private http = inject(HttpClient);
  private baseUrl = '/api/szenarien';

  list(): Observable<Szenario[]> {
    return this.http.get<Szenario[]>(this.baseUrl);
  }

  getById(id: number): Observable<Szenario> {
    return this.http.get<Szenario>(`${this.baseUrl}/${id}`);
  }

  create(dto: SzenarioCreate): Observable<Szenario> {
    return this.http.post<Szenario>(this.baseUrl, dto);
  }

  update(id: number, dto: SzenarioUpdate): Observable<Szenario> {
    return this.http.put<Szenario>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
