import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'geocoding',
    canActivate: [roleGuard('ROLE_ADMIN')],
    loadComponent: () =>
      import('./admin-geocoding.component').then((m) => m.AdminGeocodingComponent),
  },
  {
    path: 'agent-tasks',
    canActivate: [roleGuard('ROLE_ADMIN')],
    loadComponent: () =>
      import('./agent-tasks/agent-tasks-dashboard.component').then(
        (m) => m.AgentTasksDashboardComponent,
      ),
  },
  {
    path: 'agent-tasks/:id',
    canActivate: [roleGuard('ROLE_ADMIN')],
    loadComponent: () =>
      import('./agent-tasks/agent-task-detail.component').then(
        (m) => m.AgentTaskDetailComponent,
      ),
  },
];
