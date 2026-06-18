import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import {
  ColDef,
  GridApi,
  GridReadyEvent,
  RowClickedEvent,
  SizeColumnsToContentStrategy,
  themeQuartz,
} from 'ag-grid-community';
import { Abteilung } from '../../../core/models/abteilung.model';
import { Person } from '../../../core/models/person.model';
import { AbteilungService } from '../../../core/services/abteilung.service';
import { PersonService } from '../../../core/services/person.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-person-list',
  imports: [RouterLink, AgGridAngular, LoadingSpinnerComponent, FormsModule],
  templateUrl: './person-list.component.html',
})
export class PersonListComponent implements OnInit {
  private gridApi?: GridApi;
  private personService = inject(PersonService);
  private abteilungService = inject(AbteilungService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  rowData: Person[] = [];
  loading = true;
  theme = themeQuartz.withParams({ oddRowBackgroundColor: '#f0f0f0' });
  totalRows = 0;
  displayedRows = 0;
  isFilterActive = false;
  abteilungen: Abteilung[] = [];
  selectedAbteilungId: number | null = null;

  columnDefs: ColDef<Person>[] = [
    {
      headerName: 'Name',
      valueGetter: (params) => `${params.data?.firstName ?? ''} ${params.data?.lastName ?? ''}`,
    },
    { field: 'email', headerName: 'E-Mail' },
    { field: 'firmaName', headerName: 'Firma' },
    { field: 'position', headerName: 'Position' },
  ];

  defaultColDef: ColDef = {
    filter: true,
    sortable: true,
    resizable: true,
  };

  autoSizeStrategy: SizeColumnsToContentStrategy = { type: 'fitCellContents' };

  ngOnInit(): void {
    this.abteilungService.listAll().subscribe(data => this.abteilungen = data);
    this.loadPersons();
  }

  private loadPersons(): void {
    this.loading = true;
    this.personService.getAll(0, 9999, 'lastName,asc', '', this.selectedAbteilungId ?? undefined).subscribe({
      next: (page) => {
        this.rowData = page.content;
        this.totalRows = page.totalElements;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onDepartmentChange(): void {
    this.loadPersons();
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
  }

  onModelUpdated(): void {
    this.updateCounts();
  }

  private updateCounts(): void {
    if (this.gridApi) {
      this.displayedRows = this.gridApi.getDisplayedRowCount();
      this.isFilterActive = this.gridApi.isAnyFilterPresent();
    }
    this.cdr.markForCheck();
  }

  onRowClicked(event: RowClickedEvent<Person>): void {
    if (event.data) {
      this.router.navigate(['/personen', event.data.id]);
    }
  }
}
