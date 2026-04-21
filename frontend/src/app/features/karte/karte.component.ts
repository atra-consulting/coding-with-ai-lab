import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  OnDestroy,
  ViewChild,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { FeatureGroup, Map as LeafletMap } from 'leaflet';
import { KarteService } from '../../core/services/karte.service';
import { LeafletMapFactory } from '../../core/services/leaflet-map.factory';
import { MapMarker } from '../../core/models/map-marker';

const GERMANY_CENTER: [number, number] = [51.1657, 10.4515];
const GERMANY_ZOOM = 6;

function escapeHtml(value: string | null): string {
  if (value === null) return '';
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildPopupHtml(marker: MapMarker): string {
  const parts: string[] = [];

  if (marker.firmaId !== null && marker.firmaName !== null) {
    parts.push(
      `<strong><a href="/firmen/${marker.firmaId}">${escapeHtml(marker.firmaName)}</a></strong>`
    );
  } else if (marker.firmaName !== null) {
    parts.push(`<strong>${escapeHtml(marker.firmaName)}</strong>`);
  }

  const streetLine = [escapeHtml(marker.street), escapeHtml(marker.houseNumber)]
    .filter((s) => s.length > 0)
    .join(' ');
  if (streetLine.length > 0) parts.push(streetLine);

  const cityLine = [escapeHtml(marker.postalCode), escapeHtml(marker.city)]
    .filter((s) => s.length > 0)
    .join(' ');
  if (cityLine.length > 0) parts.push(cityLine);

  return parts.join('<br>');
}

@Component({
  selector: 'app-karte',
  imports: [],
  templateUrl: './karte.component.html',
  styleUrl: './karte.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KarteComponent implements AfterViewInit, OnDestroy {
  private karteService = inject(KarteService);
  private mapFactory = inject(LeafletMapFactory);
  private destroyRef = inject(DestroyRef);
  private injector = inject(Injector);

  @ViewChild('mapContainer', { static: false }) mapContainer?: ElementRef<HTMLDivElement>;

  markers = signal<MapMarker[]>([]);
  errored = signal(false);
  loaded = signal(false);
  markerCount = computed(() => this.markers().length);

  private map?: LeafletMap;

  ngAfterViewInit(): void {
    this.karteService
      .getMarkers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (markers) => {
          this.markers.set(markers);
          this.loaded.set(true);
          // Wait until Angular has rendered the map-container div in the success branch.
          afterNextRender(() => this.initMap(markers), { injector: this.injector });
        },
        error: (err) => {
          console.error('Failed to load map markers', err);
          this.errored.set(true);
          this.loaded.set(true);
        },
      });
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = undefined;
  }

  private initMap(markers: MapMarker[]): void {
    const el = this.mapContainer?.nativeElement;
    if (!el) return;

    this.map = this.mapFactory.createMap(el);
    this.mapFactory.addTileLayer(this.map);

    if (markers.length === 0) {
      this.map.setView(GERMANY_CENTER, GERMANY_ZOOM);
      return;
    }

    const group: FeatureGroup = this.mapFactory.createFeatureGroup();
    for (const m of markers) {
      const leafletMarker = this.mapFactory.createMarker(
        m.latitude,
        m.longitude,
        buildPopupHtml(m)
      );
      leafletMarker.addTo(group);
    }
    group.addTo(this.map);
    this.map.fitBounds(group.getBounds(), { padding: [40, 40] });
  }
}
