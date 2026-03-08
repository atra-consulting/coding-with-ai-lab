import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, RowClickedEvent, RowSelectionOptions, SizeColumnsToFitGridStrategy, themeQuartz } from 'ag-grid-community';
import { Person } from '../../../core/models/person.model';
import { PersonService } from '../../../core/services/person.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-person-list',
  imports: [RouterLink, AgGridAngular, LoadingSpinnerComponent],
  templateUrl: './person-list.component.html',
})
export class PersonListComponent implements OnInit {
  private personService = inject(PersonService);
  private router = inject(Router);

  rowData: Person[] = [];
  loading = true;
  theme = themeQuartz;

  columnDefs: ColDef<Person>[] = [
    {
      headerName: 'Name',
      valueGetter: (params) => `${params.data?.firstName ?? ''} ${params.data?.lastName ?? ''}`,
    },
    { field: 'email', headerName: 'E-Mail' },
    { field: 'firmaName', headerName: 'Firma' },
    { field: 'position', headerName: 'Position' },
  ];

  defaultColDef: ColDef = {
    filter: true,
    sortable: true,
    resizable: true,
  };

  autoSizeStrategy: SizeColumnsToFitGridStrategy = { type: 'fitGridWidth' };
  rowSelection: RowSelectionOptions = { mode: 'singleRow', enableClickSelection: true };

  ngOnInit(): void {
    this.personService.listAll().subscribe({
      next: (data) => {
        this.rowData = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onRowClicked(event: RowClickedEvent<Person>): void {
    if (event.data) {
      this.router.navigate(['/personen', event.data.id]);
    }
  }
}
