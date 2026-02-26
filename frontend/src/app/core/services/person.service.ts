import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Page } from '../models/page.model';
import { Person, PersonCreate } from '../models/person.model';

@Injectable({ providedIn: 'root' })
export class PersonService {
  private http = inject(HttpClient);
  private baseUrl = '/api/personen';

  getAll(page = 0, size = 10, sort = 'lastName,asc', search = ''): Observable<Page<Person>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', sort)
      .set('search', search);
    return this.http.get<Page<Person>>(this.baseUrl, { params });
  }

  getById(id: number): Observable<Person> {
    return this.http.get<Person>(`${this.baseUrl}/${id}`);
  }

  create(person: PersonCreate): Observable<Person> {
    return this.http.post<Person>(this.baseUrl, person);
  }

  update(id: number, person: PersonCreate): Observable<Person> {
    return this.http.put<Person>(`${this.baseUrl}/${id}`, person);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
