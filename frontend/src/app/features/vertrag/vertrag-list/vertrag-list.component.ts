import { Component, inject, OnInit } from '@angular/core';
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
import { Vertrag } from '../../../core/models/vertrag.model';
import { VertragService } from '../../../core/services/vertrag.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

const currencyFormatter = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

@Component({
  selector: 'app-vertrag-list',
  imports: [RouterLink, AgGridAngular, LoadingSpinnerComponent],
  templateUrl: './vertrag-list.component.html',
})
export class VertragListComponent implements OnInit {
  private gridApi?: GridApi;
  private vertragService = inject(VertragService);
  private router = inject(Router);

  rowData: Vertrag[] = [];
  loading = true;
  theme = themeQuartz.withParams({ oddRowBackgroundColor: '#f0f0f0' });
  totalRows = 0;
  displayedRows = 0;

  columnDefs: ColDef<Vertrag>[] = [
    { field: 'titel', headerName: 'Titel' },
    { field: 'firmaName', headerName: 'Firma' },
    {
      field: 'status',
      headerName: 'Status',
      filter: 'agTextColumnFilter',
    },
    {
      field: 'wert',
      headerName: 'Wert',
      filter: 'agNumberColumnFilter',
      valueFormatter: (params) => (params.value != null ? currencyFormatter.format(params.value) : '-'),
    },
    {
      field: 'startDate',
      headerName: 'Startdatum',
      filter: 'agDateColumnFilter',
      valueFormatter: (params) => {
        if (!params.value) return '-';
        return new Date(params.value).toLocaleDateString('de-DE');
      },
    },
    {
      field: 'endDate',
      headerName: 'Enddatum',
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
    this.vertragService.listAll().subscribe({
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

  private updateCounts(): void {
    this.totalRows = this.rowData.length;
    this.displayedRows = this.gridApi ? this.gridApi.getDisplayedRowCount() : this.totalRows;
  }

  onRowClicked(event: RowClickedEvent<Vertrag>): void {
    if (event.data) {
      this.router.navigate(['/vertraege', event.data.id]);
    }
  }
}
