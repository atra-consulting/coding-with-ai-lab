import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
import { StarCellRendererComponent, StarCellRendererParams } from './star-cell-renderer.component';

@Component({
  selector: 'app-firma-list',
  imports: [RouterLink, AgGridAngular, LoadingSpinnerComponent, FormsModule, StarCellRendererComponent],
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
  isFilterActive = false;
  favoritenOnly = false;

  columnDefs: ColDef<Firma>[] = [
    {
      field: 'isFavorit',
      headerName: '',
      width: 50,
      maxWidth: 50,
      sortable: true,
      filter: false,
      resizable: false,
      cellRenderer: StarCellRendererComponent,
      cellRendererParams: {
        onToggle: (id: number, current: boolean) => this.toggleFavorit(id, current),
      } as Partial<StarCellRendererParams>,
    },
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
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.firmaService.listAll(this.favoritenOnly).subscribe({
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

  toggleFavorit(id: number, _current: boolean): void {
    this.firmaService.toggleFavorit(id).subscribe({
      next: (updated) => {
        this.rowData = this.rowData.map(f => f.id === id ? { ...f, isFavorit: updated.isFavorit } : f);
        this.gridApi?.refreshCells({ force: true });
        if (this.favoritenOnly && !updated.isFavorit) {
          this.rowData = this.rowData.filter(f => f.id !== id);
        }
        this.totalRows = this.rowData.length;
      },
    });
  }

  onFavoritenOnlyChange(): void {
    this.loadData();
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

  onRowClicked(event: RowClickedEvent<Firma>): void {
    if (event.data) {
      this.router.navigate(['/firmen', event.data.id]);
    }
  }
}
