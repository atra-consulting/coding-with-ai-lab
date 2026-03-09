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
import { Adresse } from '../../../core/models/adresse.model';
import { AdresseService } from '../../../core/services/adresse.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-adresse-list',
  imports: [RouterLink, AgGridAngular, LoadingSpinnerComponent],
  templateUrl: './adresse-list.component.html',
})
export class AdresseListComponent implements OnInit {
  private gridApi?: GridApi;
  private adresseService = inject(AdresseService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  rowData: Adresse[] = [];
  loading = true;
  theme = themeQuartz.withParams({ oddRowBackgroundColor: '#f0f0f0' });
  totalRows = 0;
  displayedRows = 0;

  columnDefs: ColDef<Adresse>[] = [
    {
      headerName: 'Adresse',
      valueGetter: (params) =>
        `${params.data?.street ?? ''} ${params.data?.houseNumber ?? ''}`.trim(),
    },
    {
      headerName: 'PLZ / Ort',
      valueGetter: (params) =>
        `${params.data?.postalCode ?? ''} ${params.data?.city ?? ''}`.trim(),
    },
    { field: 'country', headerName: 'Land' },
    {
      headerName: 'Zugehörigkeit',
      valueGetter: (params) => {
        if (params.data?.firmaName) return `Firma: ${params.data.firmaName}`;
        if (params.data?.personName) return `Person: ${params.data.personName}`;
        return '-';
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
    this.adresseService.listAll().subscribe({
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

  onRowClicked(event: RowClickedEvent<Adresse>): void {
    if (event.data) {
      this.router.navigate(['/adressen', event.data.id, 'bearbeiten']);
    }
  }
}
