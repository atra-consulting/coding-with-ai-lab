import { Routes } from '@angular/router';
import { FirmaDetailComponent } from './firma-detail/firma-detail.component';
import { FirmaFormComponent } from './firma-form/firma-form.component';
import { FirmaListComponent } from './firma-list/firma-list.component';

export const FIRMA_ROUTES: Routes = [
  { path: '', component: FirmaListComponent },
  { path: 'neu', component: FirmaFormComponent },
  { path: ':id', component: FirmaDetailComponent },
  { path: ':id/bearbeiten', component: FirmaFormComponent },
];
