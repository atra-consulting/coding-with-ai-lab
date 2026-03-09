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
import { Abteilung } from '../../../core/models/abteilung.model';
import { AbteilungService } from '../../../core/services/abteilung.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-abteilung-list',
  imports: [RouterLink, AgGridAngular, LoadingSpinnerComponent],
  templateUrl: './abteilung-list.component.html',
})
export class AbteilungListComponent implements OnInit {
  private gridApi?: GridApi;
  private abteilungService = inject(AbteilungService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  rowData: Abteilung[] = [];
  loading = true;
  theme = themeQuartz.withParams({ oddRowBackgroundColor: '#f0f0f0' });
  totalRows = 0;
  displayedRows = 0;
  isFilterActive = false;

  columnDefs: ColDef<Abteilung>[] = [
    { field: 'name', headerName: 'Name' },
    { field: 'description', headerName: 'Beschreibung' },
    { field: 'firmaName', headerName: 'Firma' },
    { field: 'personenCount', headerName: 'Mitarbeiter', filter: 'agNumberColumnFilter' },
  ];

  defaultColDef: ColDef = {
    filter: true,
    sortable: true,
    resizable: true,
  };

  autoSizeStrategy: SizeColumnsToContentStrategy = { type: 'fitCellContents' };

  ngOnInit(): void {
    this.abteilungService.listAll().subscribe({
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

  onFilterChanged(): void {
    this.updateCounts();
  }

  private updateCounts(): void {
    if (this.gridApi) {
      this.totalRows = this.rowData.length;
      this.displayedRows = this.gridApi.getDisplayedRowCount();
      this.isFilterActive = this.gridApi.isAnyFilterPresent();
    }
    this.cdr.markForCheck();
  }

  onRowClicked(event: RowClickedEvent<Abteilung>): void {
    if (event.data) {
      this.router.navigate(['/abteilungen', event.data.id]);
    }
  }
}
