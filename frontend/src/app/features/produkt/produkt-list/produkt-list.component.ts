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
import { Produkt } from '../../../core/models/produkt.model';
import { ProduktService } from '../../../core/services/produkt.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

const currencyFormatter = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

@Component({
  selector: 'app-produkt-list',
  imports: [RouterLink, AgGridAngular, LoadingSpinnerComponent],
  templateUrl: './produkt-list.component.html',
})
export class ProduktListComponent implements OnInit {
  private gridApi?: GridApi;
  private produktService = inject(ProduktService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  rowData: Produkt[] = [];
  loading = true;
  theme = themeQuartz.withParams({ oddRowBackgroundColor: '#f0f0f0' });
  totalRows = 0;
  displayedRows = 0;
  isFilterActive = false;

  columnDefs: ColDef<Produkt>[] = [
    { field: 'produktNummer', headerName: 'Produkt-Nr.' },
    { field: 'name', headerName: 'Name' },
    {
      field: 'kategorie',
      headerName: 'Kategorie',
      filter: 'agTextColumnFilter',
    },
    {
      field: 'preis',
      headerName: 'Preis',
      filter: 'agNumberColumnFilter',
      valueFormatter: (params) => (params.value != null ? currencyFormatter.format(params.value) : '-'),
    },
    { field: 'einheit', headerName: 'Einheit' },
    {
      field: 'aktiv',
      headerName: 'Status',
      valueFormatter: (params) => (params.value ? 'Aktiv' : 'Inaktiv'),
      filter: 'agTextColumnFilter',
    },
  ];

  defaultColDef: ColDef = {
    filter: true,
    sortable: true,
    resizable: true,
  };

  autoSizeStrategy: SizeColumnsToContentStrategy = { type: 'fitCellContents' };

  ngOnInit(): void {
    this.produktService.listAll().subscribe({
      next: (data) => {
        this.rowData = data;
        this.totalRows = data.length;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
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

  onRowClicked(event: RowClickedEvent<Produkt>): void {
    if (event.data) {
      this.router.navigate(['/produkte', event.data.id]);
    }
  }
}
