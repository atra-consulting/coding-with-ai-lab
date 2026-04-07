import { Routes } from '@angular/router';
import { ProduktDetailComponent } from './produkt-detail/produkt-detail.component';
import { ProduktFormComponent } from './produkt-form/produkt-form.component';
import { ProduktListComponent } from './produkt-list/produkt-list.component';

export const PRODUKT_ROUTES: Routes = [
  { path: '', component: ProduktListComponent },
  { path: 'neu', component: ProduktFormComponent },
  { path: ':id', component: ProduktDetailComponent },
  { path: ':id/bearbeiten', component: ProduktFormComponent },
];
