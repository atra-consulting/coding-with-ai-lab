import { Injectable } from '@angular/core';
import * as L from 'leaflet';

L.Icon.Default.mergeOptions({
  iconUrl: 'leaflet/marker-icon.png',
  iconRetinaUrl: 'leaflet/marker-icon-2x.png',
  shadowUrl: 'leaflet/marker-shadow.png',
});

@Injectable({ providedIn: 'root' })
export class LeafletMapFactory {
  createMap(element: HTMLElement, opts?: L.MapOptions): L.Map {
    return L.map(element, opts);
  }

  addTileLayer(map: L.Map): L.TileLayer {
    return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>-Mitwirkende',
      maxZoom: 19,
    }).addTo(map);
  }

  createMarker(lat: number, lng: number, popupHtml: string): L.Marker {
    return L.marker([lat, lng]).bindPopup(popupHtml);
  }

  createFeatureGroup(): L.FeatureGroup {
    return L.featureGroup();
  }
}
