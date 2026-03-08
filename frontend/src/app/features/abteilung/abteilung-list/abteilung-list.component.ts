import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, RowClickedEvent, themeQuartz } from 'ag-grid-community';
import { Abteilung } from '../../../core/models/abteilung.model';
import { AbteilungService } from '../../../core/services/abteilung.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-abteilung-list',
  imports: [RouterLink, AgGridAngular, LoadingSpinnerComponent],
  templateUrl: './abteilung-list.component.html',
})
export class AbteilungListComponent implements OnInit {
  private abteilungService = inject(AbteilungService);
  private router = inject(Router);

  rowData: Abteilung[] = [];
  loading = true;
  theme = themeQuartz;

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
    floatingFilter: true,
  };

  ngOnInit(): void {
    this.abteilungService.listAll().subscribe({
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

  onRowClicked(event: RowClickedEvent<Abteilung>): void {
    if (event.data) {
      this.router.navigate(['/abteilungen', event.data.id]);
    }
  }
}
