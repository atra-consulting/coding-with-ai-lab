import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, RowClickedEvent, themeQuartz } from 'ag-grid-community';
import { Gehalt } from '../../../core/models/gehalt.model';
import { GehaltService } from '../../../core/services/gehalt.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

const currencyFormatter = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

@Component({
  selector: 'app-gehalt-list',
  imports: [RouterLink, AgGridAngular, LoadingSpinnerComponent],
  templateUrl: './gehalt-list.component.html',
})
export class GehaltListComponent implements OnInit {
  private gehaltService = inject(GehaltService);
  private router = inject(Router);

  rowData: Gehalt[] = [];
  loading = true;
  theme = themeQuartz;

  columnDefs: ColDef<Gehalt>[] = [
    { field: 'personName', headerName: 'Person' },
    {
      field: 'typ',
      headerName: 'Typ',
      filter: 'agSetColumnFilter',
      filterParams: {
        values: ['GRUNDGEHALT', 'BONUS', 'PROVISION', 'SONDERZAHLUNG'],
      },
    },
    {
      field: 'amount',
      headerName: 'Betrag',
      filter: 'agNumberColumnFilter',
      valueFormatter: (params) => params.value != null ? currencyFormatter.format(params.value) : '-',
    },
    {
      field: 'effectiveDate',
      headerName: 'Datum',
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
    this.gehaltService.listAll().subscribe({
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

  onRowClicked(event: RowClickedEvent<Gehalt>): void {
    if (event.data) {
      this.router.navigate(['/gehaelter', event.data.id, 'bearbeiten']);
    }
  }
}
