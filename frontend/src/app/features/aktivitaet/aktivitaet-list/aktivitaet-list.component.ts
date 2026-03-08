import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, RowClickedEvent, RowSelectionOptions, SizeColumnsToFitGridStrategy, themeQuartz } from 'ag-grid-community';
import { Aktivitaet } from '../../../core/models/aktivitaet.model';
import { AktivitaetService } from '../../../core/services/aktivitaet.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-aktivitaet-list',
  imports: [RouterLink, AgGridAngular, LoadingSpinnerComponent],
  templateUrl: './aktivitaet-list.component.html',
})
export class AktivitaetListComponent implements OnInit {
  private aktivitaetService = inject(AktivitaetService);
  private router = inject(Router);

  rowData: Aktivitaet[] = [];
  loading = true;
  theme = themeQuartz;

  columnDefs: ColDef<Aktivitaet>[] = [
    { field: 'subject', headerName: 'Betreff' },
    {
      field: 'typ',
      headerName: 'Typ',
      filter: 'agTextColumnFilter',
    },
    {
      field: 'datum',
      headerName: 'Datum',
      filter: 'agDateColumnFilter',
      valueFormatter: (params) => {
        if (!params.value) return '-';
        return new Date(params.value).toLocaleDateString('de-DE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      },
    },
    { field: 'firmaName', headerName: 'Firma', valueFormatter: (p) => p.value || '-' },
    { field: 'personName', headerName: 'Person', valueFormatter: (p) => p.value || '-' },
  ];

  defaultColDef: ColDef = {
    filter: true,
    sortable: true,
    resizable: true,
    floatingFilter: true,
  };

  autoSizeStrategy: SizeColumnsToFitGridStrategy = { type: 'fitGridWidth' };
  rowSelection: RowSelectionOptions = { mode: 'singleRow', enableClickSelection: true };

  ngOnInit(): void {
    this.aktivitaetService.listAll().subscribe({
      next: (data) => {
        this.rowData = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onRowClicked(event: RowClickedEvent<Aktivitaet>): void {
    if (event.data) {
      this.router.navigate(['/aktivitaeten', event.data.id, 'bearbeiten']);
    }
  }
}
