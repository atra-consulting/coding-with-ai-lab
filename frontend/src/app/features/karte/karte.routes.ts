import { Routes } from '@angular/router';

export const KARTE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./karte.component').then((m) => m.KarteComponent),
  },
];
