import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Aktivitaet } from '../models/aktivitaet.model';
import { DashboardStats, DepartmentSalary, TopFirma } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private baseUrl = '/api/dashboard';

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.baseUrl}/stats`);
  }

  getRecentActivities(): Observable<Aktivitaet[]> {
    return this.http.get<Aktivitaet[]>(`${this.baseUrl}/recent-activities`);
  }

  getSalaryStatistics(): Observable<DepartmentSalary[]> {
    return this.http.get<DepartmentSalary[]>(`${this.baseUrl}/salary-statistics`);
  }

  getTopCompanies(): Observable<TopFirma[]> {
    return this.http.get<TopFirma[]>(`${this.baseUrl}/top-companies`);
  }
}
