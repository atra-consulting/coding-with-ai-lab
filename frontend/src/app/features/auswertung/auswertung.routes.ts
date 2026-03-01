import { Routes } from '@angular/router';
import { PipelineDashboardComponent } from './pipeline-dashboard/pipeline-dashboard.component';
import { ReportBuilderComponent } from './report-builder/report-builder.component';

export const AUSWERTUNG_ROUTES: Routes = [
  { path: '', redirectTo: 'pipeline', pathMatch: 'full' },
  { path: 'pipeline', component: PipelineDashboardComponent },
  { path: 'report-builder', component: ReportBuilderComponent },
];
