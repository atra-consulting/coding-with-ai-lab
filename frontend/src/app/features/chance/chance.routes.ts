import { Routes } from '@angular/router';
import { ChanceDetailComponent } from './chance-detail/chance-detail.component';
import { ChanceFormComponent } from './chance-form/chance-form.component';
import { ChanceListComponent } from './chance-list/chance-list.component';

export const CHANCE_ROUTES: Routes = [
  { path: '', component: ChanceListComponent },
  { path: 'neu', component: ChanceFormComponent },
  { path: ':id', component: ChanceDetailComponent },
  { path: ':id/bearbeiten', component: ChanceFormComponent },
];
