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
  private cdr = inject(ChangeDetectorRef);

  rowData: Vertrag[] = [];
  loading = true;
  theme = themeQuartz.withParams({ oddRowBackgroundColor: '#f0f0f0' });
  totalRows = 0;
  displayedRows = 0;
  isFilterActive = false;

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

  onFilterChanged(): void {
    this.updateCounts();
  }

  private updateCounts(): void {
    if (this.gridApi) {
      this.isFilterActive = this.gridApi.isAnyFilterPresent();

      let filteredCount = 0;
      this.gridApi.forEachNodeAfterFilter(() => filteredCount++);
      this.displayedRows = filteredCount;

      let totalCount = 0;
      this.gridApi.forEachNode(() => totalCount++);
      this.totalRows = totalCount > 0 ? totalCount : this.rowData.length;
    } else {
      this.totalRows = this.rowData?.length ?? 0;
      this.displayedRows = this.totalRows;
      this.isFilterActive = false;
    }
    this.cdr.markForCheck();
  }

  onRowClicked(event: RowClickedEvent<Vertrag>): void {
    if (event.data) {
      this.router.navigate(['/vertraege', event.data.id]);
    }
  }
}
