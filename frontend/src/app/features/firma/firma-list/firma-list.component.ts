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
import { Firma } from '../../../core/models/firma.model';
import { FirmaService } from '../../../core/services/firma.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-firma-list',
  imports: [RouterLink, AgGridAngular, LoadingSpinnerComponent],
  templateUrl: './firma-list.component.html',
})
export class FirmaListComponent implements OnInit {
  private gridApi?: GridApi;
  private firmaService = inject(FirmaService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  rowData: Firma[] = [];
  loading = true;
  theme = themeQuartz.withParams({ oddRowBackgroundColor: '#f0f0f0' });
  totalRows = 0;
  displayedRows = 0;

  columnDefs: ColDef<Firma>[] = [
    { field: 'name', headerName: 'Name' },
    { field: 'industry', headerName: 'Branche' },
    { field: 'email', headerName: 'E-Mail' },
    { field: 'phone', headerName: 'Telefon' },
    { field: 'personenCount', headerName: 'Personen', filter: 'agNumberColumnFilter' },
  ];

  defaultColDef: ColDef = {
    filter: true,
    sortable: true,
    resizable: true,
  };

  autoSizeStrategy: SizeColumnsToContentStrategy = { type: 'fitCellContents' };

  ngOnInit(): void {
    this.firmaService.listAll().subscribe({
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
      let filteredCount = 0;
      this.gridApi.forEachNodeAfterFilter(() => filteredCount++);
      this.displayedRows = filteredCount;
      
      let totalCount = 0;
      this.gridApi.forEachNode(() => totalCount++);
      this.totalRows = totalCount > 0 ? totalCount : this.rowData.length;
    } else {
      this.totalRows = this.rowData?.length ?? 0;
      this.displayedRows = this.totalRows;
    }
    this.cdr.markForCheck();
  }

  onRowClicked(event: RowClickedEvent<Firma>): void {
    if (event.data) {
      this.router.navigate(['/firmen', event.data.id]);
    }
  }
}
