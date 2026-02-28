import { Routes } from '@angular/router';
import { BenutzerListComponent } from './benutzer-list/benutzer-list.component';
import { BenutzerFormComponent } from './benutzer-form/benutzer-form.component';
import { BenutzerDetailComponent } from './benutzer-detail/benutzer-detail.component';

export const BENUTZER_ROUTES: Routes = [
  { path: '', component: BenutzerListComponent },
  { path: 'neu', component: BenutzerFormComponent },
  { path: ':id', component: BenutzerDetailComponent },
  { path: ':id/bearbeiten', component: BenutzerFormComponent },
];
