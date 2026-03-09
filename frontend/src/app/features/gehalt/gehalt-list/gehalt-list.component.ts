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
import { Gehalt } from '../../../core/models/gehalt.model';
import { GehaltService } from '../../../core/services/gehalt.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

const currencyFormatter = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

@Component({
  selector: 'app-gehalt-list',
  imports: [RouterLink, AgGridAngular, LoadingSpinnerComponent],
  templateUrl: './gehalt-list.component.html',
})
export class GehaltListComponent implements OnInit {
  private gridApi?: GridApi;
  private gehaltService = inject(GehaltService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  rowData: Gehalt[] = [];
  loading = true;
  theme = themeQuartz.withParams({ oddRowBackgroundColor: '#f0f0f0' });
  totalRows = 0;
  displayedRows = 0;

  columnDefs: ColDef<Gehalt>[] = [
    { field: 'personName', headerName: 'Person' },
    {
      field: 'typ',
      headerName: 'Typ',
      filter: 'agTextColumnFilter',
    },
    {
      field: 'amount',
      headerName: 'Betrag',
      filter: 'agNumberColumnFilter',
      valueFormatter: (params) => (params.value != null ? currencyFormatter.format(params.value) : '-'),
    },
    {
      field: 'effectiveDate',
      headerName: 'Datum',
      filter: 'agDateColumnFilter',
      valueFormatter: (params) => {
        if (!params.value) return '-';
        return new Date(params.value).toLocaleDateString('de-DE');
      },
    },
  ];

  defaultColDef: ColDef = {
    filter: true,
    sortable: true,
    resizable: true,
  };

  autoSizeStrategy: SizeColumnsToContentStrategy = { type: 'fitCellContents' };

  ngOnInit(): void {
    this.gehaltService.listAll().subscribe({
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

  onRowClicked(event: RowClickedEvent<Gehalt>): void {
    if (event.data) {
      this.router.navigate(['/gehaelter', event.data.id, 'bearbeiten']);
    }
  }
}
