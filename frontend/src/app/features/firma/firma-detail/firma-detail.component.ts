import { DatePipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgbModal, NgbNavModule, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import * as L from 'leaflet';
import { Abteilung } from '../../../core/models/abteilung.model';
import { Adresse } from '../../../core/models/adresse.model';
import { Firma } from '../../../core/models/firma.model';
import { Page } from '../../../core/models/page.model';
import { Person } from '../../../core/models/person.model';
import { FirmaService } from '../../../core/services/firma.service';
import { LanguageService } from '../../../core/services/language.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-firma-detail',
  imports: [RouterLink, NgbNavModule, NgbPagination, LoadingSpinnerComponent, DatePipe, TranslateModule],
  templateUrl: './firma-detail.component.html',
})
export class FirmaDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private firmaService = inject(FirmaService);
  private modalService = inject(NgbModal);
  private notification = inject(NotificationService);
  public langService = inject(LanguageService);

  @ViewChild('mapContainer') mapContainer!: ElementRef;

  firma: Firma | null = null;
  personenPage: Page<Person> | null = null;
  abteilungenPage: Page<Abteilung> | null = null;
  adressen: Adresse[] = [];
  activeTab = 1;
  personenCurrentPage = 1;
  abteilungenCurrentPage = 1;
  loading = true;
  mapLoading = true;

  private map: L.Map | null = null;
  private mapReady = false;
  private pendingAdressen: Adresse[] | null = null;
  private markerMap = new Map<number, L.Marker>();

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

  ngAfterViewInit(): void {
    this.mapReady = true;
    if (this.pendingAdressen) {
      this.initMap(this.pendingAdressen);
      this.pendingAdressen = null;
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
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

  loadAdressen(): void {
    if (!this.firma) return;
    this.firmaService.getAdressen(this.firma.id).subscribe((data) => {
      this.adressen = data.content;
      if (this.mapReady) {
        this.initMap(this.adressen);
      } else {
        this.pendingAdressen = this.adressen;
      }
    });
  }

  private async initMap(adressen: Adresse[]): Promise<void> {
    if (!this.mapContainer || adressen.length === 0) {
      this.mapLoading = false;
      return;
    }

    // Fix default marker icon paths (Leaflet + bundler issue)
    const iconDefault = L.icon({
      iconRetinaUrl: '/assets/marker-icon-2x.png',
      iconUrl: '/assets/marker-icon.png',
      shadowUrl: '/assets/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });
    L.Marker.prototype.options.icon = iconDefault;

    this.map = L.map(this.mapContainer.nativeElement);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(this.map);

    const markers: L.Marker[] = [];

    for (const adresse of adressen) {
      try {
        const coords = await this.geocode(adresse);
        if (coords) {
          const marker = L.marker([coords.lat, coords.lon])
            .addTo(this.map!)
            .bindPopup(
              `<strong>${adresse.street} ${adresse.houseNumber}</strong><br>${adresse.postalCode} ${adresse.city}`,
            );
          markers.push(marker);
          this.markerMap.set(adresse.id, marker);
        }
      } catch {
        // Skip addresses that can't be geocoded
      }
    }

    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      this.map.fitBounds(group.getBounds().pad(0.2));
    } else {
      // Default to center of Germany
      this.map.setView([51.1657, 10.4515], 6);
    }

    this.mapLoading = false;
  }

  private geocode(adresse: Adresse): Promise<{ lat: number; lon: number } | null> {
    const params = new URLSearchParams({
      format: 'json',
      street: `${adresse.houseNumber} ${adresse.street}`,
      city: adresse.city,
      postalcode: adresse.postalCode,
      country: 'DE',
      limit: '1',
    });
    const url = `https://nominatim.openstreetmap.org/search?${params}`;
    return fetch(url, {
      headers: { 'User-Agent': 'CRM-App/1.0' },
    })
      .then((res) => res.json())
      .then((data: { lat: string; lon: string }[]) => {
        if (data && data.length > 0) {
          return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        }
        return null;
      });
  }

  onPersonenPageChange(p: number): void {
    this.personenCurrentPage = p;
    this.loadPersonen();
  }

  onAbteilungenPageChange(p: number): void {
    this.abteilungenCurrentPage = p;
    this.loadAbteilungen();
  }

  highlightMarker(adresseId: number): void {
    const marker = this.markerMap.get(adresseId);
    if (marker) {
      marker.openPopup();
      const el = marker.getElement();
      if (el) {
        el.style.filter = 'hue-rotate(120deg) drop-shadow(0 0 6px #0d6efd)';
        el.style.transform = el.style.transform.replace(/scale\([^)]*\)/, '') + ' scale(1.3)';
      }
    }
  }

  resetMarker(adresseId: number): void {
    const marker = this.markerMap.get(adresseId);
    if (marker) {
      marker.closePopup();
      const el = marker.getElement();
      if (el) {
        el.style.filter = '';
        el.style.transform = el.style.transform.replace(/scale\([^)]*\)/, '');
      }
    }
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
}
