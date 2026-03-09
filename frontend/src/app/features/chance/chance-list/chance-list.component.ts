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
import { Chance } from '../../../core/models/chance.model';
import { ChanceService } from '../../../core/services/chance.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

const currencyFormatter = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

@Component({
  selector: 'app-chance-list',
  imports: [RouterLink, AgGridAngular, LoadingSpinnerComponent],
  templateUrl: './chance-list.component.html',
})
export class ChanceListComponent implements OnInit {
  private gridApi?: GridApi;
  private chanceService = inject(ChanceService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  rowData: Chance[] = [];
  loading = true;
  theme = themeQuartz.withParams({ oddRowBackgroundColor: '#f0f0f0' });
  totalRows = 0;
  displayedRows = 0;
  isFilterActive = false;

  columnDefs: ColDef<Chance>[] = [
    { field: 'titel', headerName: 'Titel' },
    { field: 'firmaName', headerName: 'Firma' },
    { field: 'kontaktPersonName', headerName: 'Kontaktperson', valueFormatter: (p) => p.value || '-' },
    {
      field: 'phase',
      headerName: 'Phase',
      filter: 'agTextColumnFilter',
    },
    {
      field: 'wert',
      headerName: 'Wert',
      filter: 'agNumberColumnFilter',
      valueFormatter: (params) => params.value != null ? currencyFormatter.format(params.value) : '-',
    },
    {
      field: 'wahrscheinlichkeit',
      headerName: 'Wahrscheinlichkeit',
      filter: 'agNumberColumnFilter',
      valueFormatter: (params) => params.value != null ? `${params.value}%` : '-',
    },
    {
      field: 'erwartetesDatum',
      headerName: 'Erwartetes Datum',
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
    this.chanceService.listAll().subscribe({
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

  onRowClicked(event: RowClickedEvent<Chance>): void {
    if (event.data) {
      this.router.navigate(['/chancen', event.data.id]);
    }
  }
}
