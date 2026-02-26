import { DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgbNavModule, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { Abteilung } from '../../../core/models/abteilung.model';
import { Firma } from '../../../core/models/firma.model';
import { Page } from '../../../core/models/page.model';
import { Person } from '../../../core/models/person.model';
import { FirmaService } from '../../../core/services/firma.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-firma-detail',
  imports: [RouterLink, NgbNavModule, NgbPagination, LoadingSpinnerComponent, DatePipe],
  templateUrl: './firma-detail.component.html',
})
export class FirmaDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private firmaService = inject(FirmaService);

  firma: Firma | null = null;
  personenPage: Page<Person> | null = null;
  abteilungenPage: Page<Abteilung> | null = null;
  activeTab = 1;
  personenCurrentPage = 1;
  abteilungenCurrentPage = 1;
  loading = true;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.firmaService.getById(id).subscribe({
      next: (data) => {
        this.firma = data;
        this.loading = false;
        this.loadPersonen();
        this.loadAbteilungen();
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
}
