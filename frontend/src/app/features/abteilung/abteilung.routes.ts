import { Routes } from '@angular/router';
import { AbteilungDetailComponent } from './abteilung-detail/abteilung-detail.component';
import { AbteilungFormComponent } from './abteilung-form/abteilung-form.component';
import { AbteilungListComponent } from './abteilung-list/abteilung-list.component';

export const ABTEILUNG_ROUTES: Routes = [
  { path: '', component: AbteilungListComponent },
  { path: 'neu', component: AbteilungFormComponent },
  { path: ':id', component: AbteilungDetailComponent },
  { path: ':id/bearbeiten', component: AbteilungFormComponent },
];
