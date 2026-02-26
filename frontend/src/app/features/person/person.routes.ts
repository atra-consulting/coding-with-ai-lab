import { Routes } from '@angular/router';
import { PersonDetailComponent } from './person-detail/person-detail.component';
import { PersonFormComponent } from './person-form/person-form.component';
import { PersonListComponent } from './person-list/person-list.component';

export const PERSON_ROUTES: Routes = [
  { path: '', component: PersonListComponent },
  { path: 'neu', component: PersonFormComponent },
  { path: ':id', component: PersonDetailComponent },
  { path: ':id/bearbeiten', component: PersonFormComponent },
];
