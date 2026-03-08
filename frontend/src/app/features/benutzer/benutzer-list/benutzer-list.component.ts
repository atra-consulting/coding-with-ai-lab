import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, RowClickedEvent, themeQuartz } from 'ag-grid-community';
import { Benutzer } from '../../../core/models/benutzer.model';
import { BenutzerService } from '../../../core/services/benutzer.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-benutzer-list',
  imports: [RouterLink, AgGridAngular, LoadingSpinnerComponent],
  templateUrl: './benutzer-list.component.html',
})
export class BenutzerListComponent implements OnInit {
  private benutzerService = inject(BenutzerService);
  private router = inject(Router);

  rowData: Benutzer[] = [];
  loading = true;
  theme = themeQuartz;

  columnDefs: ColDef<Benutzer>[] = [
    { field: 'benutzername', headerName: 'Benutzername' },
    {
      headerName: 'Name',
      valueGetter: (params) => `${params.data?.vorname ?? ''} ${params.data?.nachname ?? ''}`,
    },
    { field: 'email', headerName: 'E-Mail' },
    {
      field: 'rollen',
      headerName: 'Rollen',
      valueFormatter: (params) => params.value ? params.value.join(', ') : '-',
    },
    {
      field: 'aktiv',
      headerName: 'Status',
      valueFormatter: (params) => params.value ? 'Aktiv' : 'Inaktiv',
      filter: 'agSetColumnFilter',
      filterParams: {
        values: [true, false],
        valueFormatter: (params: { value: boolean }) => params.value ? 'Aktiv' : 'Inaktiv',
      },
    },
  ];

  defaultColDef: ColDef = {
    filter: true,
    sortable: true,
    resizable: true,
    floatingFilter: true,
  };

  ngOnInit(): void {
    this.benutzerService.listAll().subscribe({
      next: (data) => {
        this.rowData = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onGridReady(event: GridReadyEvent): void {
    event.api.sizeColumnsToFit();
  }

  onRowClicked(event: RowClickedEvent<Benutzer>): void {
    if (event.data) {
      this.router.navigate(['/benutzer', event.data.id]);
    }
  }
}
