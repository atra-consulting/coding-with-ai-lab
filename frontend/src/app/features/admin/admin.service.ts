import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { GeocodeResult } from '../../core/models/geocode-result.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);

  geocodeAddresses(force = false): Observable<GeocodeResult> {
    if (force) {
      return this.http.post<GeocodeResult>(
        '/api/admin/geocode-addresses',
        {},
        { params: new HttpParams().set('force', 'true') },
      );
    }
    return this.http.post<GeocodeResult>('/api/admin/geocode-addresses', {});
  }
}
