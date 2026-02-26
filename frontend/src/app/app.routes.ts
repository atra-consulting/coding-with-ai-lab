import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
  },
  {
    path: 'firmen',
    loadChildren: () => import('./features/firma/firma.routes').then((m) => m.FIRMA_ROUTES),
  },
  {
    path: 'personen',
    loadChildren: () => import('./features/person/person.routes').then((m) => m.PERSON_ROUTES),
  },
  {
    path: 'abteilungen',
    loadChildren: () =>
      import('./features/abteilung/abteilung.routes').then((m) => m.ABTEILUNG_ROUTES),
  },
  {
    path: 'adressen',
    loadChildren: () => import('./features/adresse/adresse.routes').then((m) => m.ADRESSE_ROUTES),
  },
  {
    path: 'gehaelter',
    loadChildren: () => import('./features/gehalt/gehalt.routes').then((m) => m.GEHALT_ROUTES),
  },
  {
    path: 'aktivitaeten',
    loadChildren: () =>
      import('./features/aktivitaet/aktivitaet.routes').then((m) => m.AKTIVITAET_ROUTES),
  },
  {
    path: 'vertraege',
    loadChildren: () => import('./features/vertrag/vertrag.routes').then((m) => m.VERTRAG_ROUTES),
  },
  {
    path: 'chancen',
    loadChildren: () => import('./features/chance/chance.routes').then((m) => m.CHANCE_ROUTES),
  },
  { path: '**', redirectTo: 'dashboard' },
];
