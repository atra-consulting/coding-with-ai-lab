import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { BenutzerService } from '../../../core/services/benutzer.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Benutzer } from '../../../core/models/benutzer.model';
import { Page } from '../../../core/models/page.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-benutzer-list',
  imports: [RouterLink, FormsModule, NgbPagination, LoadingSpinnerComponent],
  templateUrl: './benutzer-list.component.html',
})
export class BenutzerListComponent implements OnInit {
  private benutzerService = inject(BenutzerService);
  private notification = inject(NotificationService);

  page: Page<Benutzer> | null = null;
  currentPage = 1;
  pageSize = 10;
  search = '';
  loading = true;

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.benutzerService
      .getAll(this.currentPage - 1, this.pageSize, 'benutzername,asc', this.search)
      .subscribe({
        next: (data) => {
          this.page = data;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  onPageChange(p: number): void {
    this.currentPage = p;
    this.loadData();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadData();
  }

  toggleActive(benutzer: Benutzer, event: Event): void {
    event.stopPropagation();
    this.benutzerService.toggleActive(benutzer.id).subscribe({
      next: () => {
        const action = benutzer.aktiv ? 'deaktiviert' : 'aktiviert';
        this.notification.success(`Benutzer erfolgreich ${action}`);
        this.loadData();
      },
      error: () => {},
    });
  }
}
