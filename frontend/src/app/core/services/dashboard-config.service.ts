import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface DashboardConfig {
  visibleWidgets: string[];
}

@Injectable({ providedIn: 'root' })
export class DashboardConfigService {
  private http = inject(HttpClient);
  private baseUrl = '/api/dashboard-config';

  getConfig(): Observable<DashboardConfig | null> {
    return this.http.get<DashboardConfig>(this.baseUrl).pipe(
      catchError(() => of(null))
    );
  }

  saveConfig(config: DashboardConfig): Observable<DashboardConfig> {
    return this.http.put<DashboardConfig>(this.baseUrl, config);
  }
}
