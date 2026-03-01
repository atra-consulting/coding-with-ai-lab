import { Routes } from '@angular/router';
import { PipelineDashboardComponent } from './pipeline-dashboard/pipeline-dashboard.component';

export const AUSWERTUNG_ROUTES: Routes = [
  { path: '', redirectTo: 'pipeline', pathMatch: 'full' },
  { path: 'pipeline', component: PipelineDashboardComponent },
];
