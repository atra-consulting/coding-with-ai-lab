import { Routes } from '@angular/router';
import { AdresseFormComponent } from './adresse-form/adresse-form.component';
import { AdresseListComponent } from './adresse-list/adresse-list.component';

export const ADRESSE_ROUTES: Routes = [
  { path: '', component: AdresseListComponent },
  { path: 'neu', component: AdresseFormComponent },
  { path: ':id/bearbeiten', component: AdresseFormComponent },
];
