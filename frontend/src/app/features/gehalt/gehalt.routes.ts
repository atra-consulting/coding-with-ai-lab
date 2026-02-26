import { Routes } from '@angular/router';
import { GehaltFormComponent } from './gehalt-form/gehalt-form.component';
import { GehaltListComponent } from './gehalt-list/gehalt-list.component';

export const GEHALT_ROUTES: Routes = [
  { path: '', component: GehaltListComponent },
  { path: 'neu', component: GehaltFormComponent },
  { path: ':id/bearbeiten', component: GehaltFormComponent },
];
