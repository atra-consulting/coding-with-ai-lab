import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';

export const ADMIN_ROUTES: Routes = [
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
  {
    path: 'cron',
    canActivate: [roleGuard('ROLE_ADMIN')],
    loadComponent: () =>
      import('./cron/cron-dashboard.component').then((m) => m.CronDashboardComponent),
  },
  // Kein roleGuard: Das Ticket-Board ist fuer jeden eingeloggten Nutzer
  // lesbar, damit Workshop-Teilnehmer den Status verfolgen koennen.
  // Schreibende Aktionen sind in den Komponenten auf Admins beschraenkt.
  {
    path: 'tickets',
    loadComponent: () =>
      import('./tickets/ticket-board.component').then((m) => m.TicketBoardComponent),
  },
  {
    path: 'tickets/:id',
    loadComponent: () =>
      import('./tickets/ticket-detail.component').then((m) => m.TicketDetailComponent),
  },
];
