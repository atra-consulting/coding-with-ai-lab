import { Routes } from '@angular/router';
import { AktivitaetFormComponent } from './aktivitaet-form/aktivitaet-form.component';
import { AktivitaetListComponent } from './aktivitaet-list/aktivitaet-list.component';

export const AKTIVITAET_ROUTES: Routes = [
  { path: '', component: AktivitaetListComponent },
  { path: 'neu', component: AktivitaetFormComponent },
  { path: ':id/bearbeiten', component: AktivitaetFormComponent },
];
