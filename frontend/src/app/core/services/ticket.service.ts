import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Ticket,
  TicketBoard,
  TicketCommentCreate,
  TicketCreate,
  TicketOwner,
  TicketStatus,
  TicketSummary,
  TicketType,
} from '../models/ticket.model';
import { Page } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class TicketService {
  private http = inject(HttpClient);
  private baseUrl = '/api/tickets';

  getBoard(): Observable<TicketBoard> {
    return this.http.get<TicketBoard>(`${this.baseUrl}/board`);
  }

  getSummary(): Observable<TicketSummary> {
    return this.http.get<TicketSummary>(`${this.baseUrl}/summary`);
  }

  getById(id: number): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.baseUrl}/${id}`);
  }

  getAll(
    page = 0,
    size = 20,
    sort = 'createdAt,desc',
    filters?: { type?: TicketType; status?: TicketStatus; owner?: TicketOwner },
  ): Observable<Page<Ticket>> {
    let params = new HttpParams().set('page', page).set('size', size).set('sort', sort);
    if (filters?.type) {
      params = params.set('type', filters.type);
    }
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.owner) {
      params = params.set('owner', filters.owner);
    }
    return this.http.get<Page<Ticket>>(this.baseUrl, { params });
  }

  create(dto: TicketCreate): Observable<Ticket> {
    return this.http.post<Ticket>(this.baseUrl, dto);
  }

  setStatus(id: number, status: TicketStatus): Observable<Ticket> {
    return this.http.patch<Ticket>(`${this.baseUrl}/${id}/status`, { status });
  }

  setOwner(id: number, owner: TicketOwner): Observable<Ticket> {
    return this.http.patch<Ticket>(`${this.baseUrl}/${id}/owner`, { owner });
  }

  wontDo(id: number, comment?: string): Observable<Ticket> {
    return this.http.post<Ticket>(`${this.baseUrl}/${id}/wont-do`, { comment });
  }

  addComment(id: number, dto: TicketCommentCreate): Observable<Ticket> {
    return this.http.post<Ticket>(`${this.baseUrl}/${id}/comments`, dto);
  }
}
