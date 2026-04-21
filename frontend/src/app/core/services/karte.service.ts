import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { MapMarker } from '../models/map-marker';

@Injectable({ providedIn: 'root' })
export class KarteService {
  private http = inject(HttpClient);
  private baseUrl = '/api/adressen';

  getMarkers(): Observable<MapMarker[]> {
    return this.http.get<MapMarker[]>(`${this.baseUrl}/map-markers`);
  }
}
