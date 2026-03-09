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
import { Aktivitaet } from '../../../core/models/aktivitaet.model';
import { AktivitaetService } from '../../../core/services/aktivitaet.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-aktivitaet-list',
  imports: [RouterLink, AgGridAngular, LoadingSpinnerComponent],
  templateUrl: './aktivitaet-list.component.html',
})
export class AktivitaetListComponent implements OnInit {
  private gridApi?: GridApi;
  private aktivitaetService = inject(AktivitaetService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  rowData: Aktivitaet[] = [];
  loading = true;
  theme = themeQuartz.withParams({ oddRowBackgroundColor: '#f0f0f0' });
  totalRows = 0;
  displayedRows = 0;

  columnDefs: ColDef<Aktivitaet>[] = [
    { field: 'subject', headerName: 'Betreff' },
    {
      field: 'typ',
      headerName: 'Typ',
      filter: 'agTextColumnFilter',
    },
    {
      field: 'datum',
      headerName: 'Datum',
      filter: 'agDateColumnFilter',
      valueFormatter: (params) => {
        if (!params.value) return '-';
        return new Date(params.value).toLocaleDateString('de-DE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      },
    },
    { field: 'firmaName', headerName: 'Firma', valueFormatter: (p) => p.value || '-' },
    { field: 'personName', headerName: 'Person', valueFormatter: (p) => p.value || '-' },
  ];

  defaultColDef: ColDef = {
    filter: true,
    sortable: true,
    resizable: true,
  };

  autoSizeStrategy: SizeColumnsToContentStrategy = { type: 'fitCellContents' };

  ngOnInit(): void {
    this.aktivitaetService.listAll().subscribe({
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
    this.cdr.markForCheck();
  }

  onRowClicked(event: RowClickedEvent<Aktivitaet>): void {
    if (event.data) {
      this.router.navigate(['/aktivitaeten', event.data.id, 'bearbeiten']);
    }
  }
}
