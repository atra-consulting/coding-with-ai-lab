import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, RowClickedEvent, themeQuartz } from 'ag-grid-community';
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
  private vertragService = inject(VertragService);
  private router = inject(Router);

  rowData: Vertrag[] = [];
  loading = true;
  theme = themeQuartz;

  columnDefs: ColDef<Vertrag>[] = [
    { field: 'titel', headerName: 'Titel' },
    { field: 'firmaName', headerName: 'Firma' },
    {
      field: 'status',
      headerName: 'Status',
      filter: 'agSetColumnFilter',
      filterParams: {
        values: ['ENTWURF', 'AKTIV', 'ABGELAUFEN', 'GEKUENDIGT'],
      },
    },
    {
      field: 'wert',
      headerName: 'Wert',
      filter: 'agNumberColumnFilter',
      valueFormatter: (params) => params.value != null ? currencyFormatter.format(params.value) : '-',
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
    floatingFilter: true,
  };

  ngOnInit(): void {
    this.vertragService.listAll().subscribe({
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

  onRowClicked(event: RowClickedEvent<Vertrag>): void {
    if (event.data) {
      this.router.navigate(['/vertraege', event.data.id]);
    }
  }
}
