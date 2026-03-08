import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, RowClickedEvent, SizeColumnsToContentStrategy, themeQuartz } from 'ag-grid-community';
import { Firma } from '../../../core/models/firma.model';
import { FirmaService } from '../../../core/services/firma.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-firma-list',
  imports: [RouterLink, AgGridAngular, LoadingSpinnerComponent],
  templateUrl: './firma-list.component.html',
})
export class FirmaListComponent implements OnInit {
  private firmaService = inject(FirmaService);
  private router = inject(Router);

  rowData: Firma[] = [];
  loading = true;
  theme = themeQuartz.withParams({ oddRowBackgroundColor: '#f0f0f0' });

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
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onRowClicked(event: RowClickedEvent<Firma>): void {
    if (event.data) {
      this.router.navigate(['/firmen', event.data.id]);
    }
  }
}
