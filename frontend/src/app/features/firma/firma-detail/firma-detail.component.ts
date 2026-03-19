import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgbModal, NgbNavModule, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import * as L from 'leaflet';
import { Abteilung } from '../../../core/models/abteilung.model';
import { Adresse } from '../../../core/models/adresse.model';
import { Firma } from '../../../core/models/firma.model';
import { Page } from '../../../core/models/page.model';
import { Person } from '../../../core/models/person.model';
import { FirmaService } from '../../../core/services/firma.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
  iconUrl: 'assets/leaflet/marker-icon.png',
  shadowUrl: 'assets/leaflet/marker-shadow.png',
});

@Component({
  selector: 'app-firma-detail',
  imports: [RouterLink, NgbNavModule, NgbPagination, LoadingSpinnerComponent, DatePipe],
  templateUrl: './firma-detail.component.html',
})
export class FirmaDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private firmaService = inject(FirmaService);
  private modalService = inject(NgbModal);
  private notification = inject(NotificationService);

  firma: Firma | null = null;
  personenPage: Page<Person> | null = null;
  abteilungenPage: Page<Abteilung> | null = null;
  activeTab = 1;
  personenCurrentPage = 1;
  abteilungenCurrentPage = 1;
  loading = true;
  adressen: Adresse[] = [];
  private map: L.Map | null = null;
  private markers = new Map<number, L.Marker>();
  mapInitialized = false;
  routeLayer: L.Polyline | null = null;
  routeInfo: { distance: string; duration: string } | null = null;
  routeLoading = false;

  @ViewChild('mapContainer') mapContainer!: ElementRef;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.firmaService.getById(id).subscribe({
      next: (data) => {
        this.firma = data;
        this.loading = false;
        this.loadPersonen();
        this.loadAbteilungen();
        this.loadAdressen();
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  loadPersonen(): void {
    if (!this.firma) return;
    this.firmaService
      .getPersonen(this.firma.id, this.personenCurrentPage - 1)
      .subscribe((data) => (this.personenPage = data));
  }

  loadAbteilungen(): void {
    if (!this.firma) return;
    this.firmaService
      .getAbteilungen(this.firma.id, this.abteilungenCurrentPage - 1)
      .subscribe((data) => (this.abteilungenPage = data));
  }

  onPersonenPageChange(p: number): void {
    this.personenCurrentPage = p;
    this.loadPersonen();
  }

  onAbteilungenPageChange(p: number): void {
    this.abteilungenCurrentPage = p;
    this.loadAbteilungen();
  }

  onDelete(): void {
    if (!this.firma) return;
    const modalRef = this.modalService.open(ConfirmDialogComponent);
    modalRef.componentInstance.title = 'Firma löschen';
    modalRef.componentInstance.message = `Möchten Sie die Firma "${this.firma.name}" wirklich löschen?`;
    modalRef.result.then(
      () => {
        this.firmaService.delete(this.firma!.id).subscribe({
          next: () => {
            this.notification.success('Firma erfolgreich gelöscht');
            this.router.navigate(['/firmen']);
          },
          error: () => {},
        });
      },
      () => {},
    );
  }

  loadAdressen(): void {
    if (!this.firma) return;
    this.firmaService.getAdressen(this.firma.id).subscribe((data) => {
      this.adressen = data.content;
    });
  }

  get geocodedAdressen(): Adresse[] {
    return this.adressen.filter((a) => a.latitude != null && a.longitude != null);
  }

  onTabChange(tabId: number): void {
    if (tabId === 3 && !this.mapInitialized && this.geocodedAdressen.length > 0) {
      this.mapInitialized = true;
      setTimeout(() => this.initMap(), 200);
    }
  }

  private initMap(): void {
    if (!this.mapContainer) return;

    this.map = L.map(this.mapContainer.nativeElement);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.map);

    const markers: L.Marker[] = [];
    for (const adresse of this.geocodedAdressen) {
      const marker = L.marker([adresse.latitude!, adresse.longitude!])
        .bindPopup(
          `<strong>${adresse.street} ${adresse.houseNumber || ''}</strong><br>${adresse.postalCode} ${adresse.city}`,
        )
        .addTo(this.map);
      markers.push(marker);
      this.markers.set(adresse.id, marker);
    }

    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      this.map.fitBounds(group.getBounds().pad(0.1));
    } else {
      this.map.setView([51.1657, 10.4515], 6);
    }
  }

  highlightAdresse(adresse: Adresse): void {
    const marker = this.markers.get(adresse.id);
    if (marker && this.map) {
      this.map.setView(marker.getLatLng(), 13, { animate: true });
      marker.openPopup();
    }
  }

  toggleRoute(): void {
    if (this.routeLayer) {
      this.routeLayer.remove();
      this.routeLayer = null;
      this.routeInfo = null;
      return;
    }

    const coords = this.geocodedAdressen;
    if (coords.length < 2 || !this.map) return;

    this.routeLoading = true;
    const coordStr = coords.map((a) => `${a.longitude},${a.latitude}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=polyline`;

    this.http.get<any>(url).subscribe({
      next: (res) => {
        this.routeLoading = false;
        if (res.code !== 'Ok' || !res.routes?.length) return;

        const route = res.routes[0];
        const points = this.decodePolyline(route.geometry);
        this.routeLayer = L.polyline(points, { color: '#0d6efd', weight: 4, opacity: 0.8 }).addTo(this.map!);
        this.map!.fitBounds(this.routeLayer.getBounds().pad(0.1));

        const distKm = (route.distance / 1000).toFixed(1);
        const durMin = Math.round(route.duration / 60);
        const hours = Math.floor(durMin / 60);
        const mins = durMin % 60;
        this.routeInfo = {
          distance: `${distKm} km`,
          duration: hours > 0 ? `${hours} h ${mins} min` : `${mins} min`,
        };
      },
      error: () => {
        this.routeLoading = false;
        this.notification.error('Route konnte nicht berechnet werden');
      },
    });
  }

  private decodePolyline(encoded: string): [number, number][] {
    const points: [number, number][] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let shift = 0;
      let result = 0;
      let byte: number;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      lat += result & 1 ? ~(result >> 1) : result >> 1;

      shift = 0;
      result = 0;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      lng += result & 1 ? ~(result >> 1) : result >> 1;

      points.push([lat / 1e5, lng / 1e5]);
    }
    return points;
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}
