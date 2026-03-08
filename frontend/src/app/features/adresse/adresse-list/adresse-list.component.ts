import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, RowClickedEvent, RowSelectionOptions, SizeColumnsToFitGridStrategy, themeQuartz } from 'ag-grid-community';
import { Adresse } from '../../../core/models/adresse.model';
import { AdresseService } from '../../../core/services/adresse.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-adresse-list',
  imports: [RouterLink, AgGridAngular, LoadingSpinnerComponent],
  templateUrl: './adresse-list.component.html',
})
export class AdresseListComponent implements OnInit {
  private adresseService = inject(AdresseService);
  private router = inject(Router);

  rowData: Adresse[] = [];
  loading = true;
  theme = themeQuartz;

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

  autoSizeStrategy: SizeColumnsToFitGridStrategy = { type: 'fitGridWidth' };
  rowSelection: RowSelectionOptions = { mode: 'singleRow', enableClickSelection: true };

  ngOnInit(): void {
    this.adresseService.listAll().subscribe({
      next: (data) => {
        this.rowData = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onRowClicked(event: RowClickedEvent<Adresse>): void {
    if (event.data) {
      this.router.navigate(['/adressen', event.data.id, 'bearbeiten']);
    }
  }
}
