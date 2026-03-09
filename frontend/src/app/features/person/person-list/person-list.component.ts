import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import {
  ColDef,
  GridApi,
  GridReadyEvent,
  RowClickedEvent,
  SizeColumnsToContentStrategy,
  themeQuartz,
} from 'ag-grid-community';
import { Person } from '../../../core/models/person.model';
import { PersonService } from '../../../core/services/person.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-person-list',
  imports: [RouterLink, AgGridAngular, LoadingSpinnerComponent],
  templateUrl: './person-list.component.html',
})
export class PersonListComponent implements OnInit {
  private gridApi?: GridApi;
  private personService = inject(PersonService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  rowData: Person[] = [];
  loading = true;
  theme = themeQuartz.withParams({ oddRowBackgroundColor: '#f0f0f0' });
  totalRows = 0;
  displayedRows = 0;

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
    this.personService.listAll().subscribe({
      next: (data) => {
        this.rowData = data;
        this.loading = false;
        this.updateCounts();
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    this.updateCounts();
  }

  onModelUpdated(): void {
    this.updateCounts();
  }

  onFilterChanged(): void {
    this.updateCounts();
  }

  private updateCounts(): void {
    this.totalRows = this.rowData?.length ?? 0;
    const count = this.gridApi ? this.gridApi.getDisplayedRowCount() : this.totalRows;
    this.displayedRows = typeof count === 'number' ? count : this.totalRows;
    this.cdr.markForCheck();
  }

  onRowClicked(event: RowClickedEvent<Person>): void {
    if (event.data) {
      this.router.navigate(['/personen', event.data.id]);
    }
  }
}
