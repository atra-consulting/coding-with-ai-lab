import { Routes } from '@angular/router';
import { VertragDetailComponent } from './vertrag-detail/vertrag-detail.component';
import { VertragFormComponent } from './vertrag-form/vertrag-form.component';
import { VertragListComponent } from './vertrag-list/vertrag-list.component';

export const VERTRAG_ROUTES: Routes = [
  { path: '', component: VertragListComponent },
  { path: 'neu', component: VertragFormComponent },
  { path: ':id', component: VertragDetailComponent },
  { path: ':id/bearbeiten', component: VertragFormComponent },
];
