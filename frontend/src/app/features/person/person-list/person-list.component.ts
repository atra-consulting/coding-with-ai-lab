import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgbModal, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { Page } from '../../../core/models/page.model';
import { Person } from '../../../core/models/person.model';
import { NotificationService } from '../../../core/services/notification.service';
import { PersonService } from '../../../core/services/person.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-person-list',
  imports: [RouterLink, FormsModule, NgbPagination, LoadingSpinnerComponent],
  templateUrl: './person-list.component.html',
})
export class PersonListComponent implements OnInit {
  private personService = inject(PersonService);
  private modalService = inject(NgbModal);
  private notification = inject(NotificationService);

  page: Page<Person> | null = null;
  currentPage = 1;
  pageSize = 10;
  search = '';
  loading = true;

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.personService
      .getAll(this.currentPage - 1, this.pageSize, 'lastName,asc', this.search)
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

  confirmDelete(person: Person): void {
    const modalRef = this.modalService.open(ConfirmDialogComponent);
    modalRef.componentInstance.title = 'Person löschen';
    modalRef.componentInstance.message = `Möchten Sie "${person.firstName} ${person.lastName}" wirklich löschen?`;
    modalRef.result.then(
      () => {
        this.personService.delete(person.id).subscribe({
          next: () => {
            this.notification.success('Person erfolgreich gelöscht');
            this.loadData();
          },
          error: () => {},
        });
      },
      () => {},
    );
  }
}
