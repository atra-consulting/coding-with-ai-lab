import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';

export const routes: Routes = [
  {
    path: 'welcome',
    loadComponent: () =>
      import('./features/welcome/welcome.component').then((m) => m.WelcomeComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'feedback',
    loadComponent: () =>
      import('./features/feedback/feedback-form.component').then((m) => m.FeedbackFormComponent),
  },
  {
    path: 'danke',
    loadComponent: () =>
      import('./features/feedback/thankyou.component').then((m) => m.ThankyouComponent),
  },
  {
    path: 'feedback-qr',
    loadComponent: () =>
      import('./features/feedback/feedback-qr.component').then((m) => m.FeedbackQrComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
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
        loadChildren: () =>
          import('./features/adresse/adresse.routes').then((m) => m.ADRESSE_ROUTES),
      },
      {
        path: 'gehaelter',
        canActivate: [permissionGuard('GEHAELTER')],
        loadChildren: () => import('./features/gehalt/gehalt.routes').then((m) => m.GEHALT_ROUTES),
      },
      {
        path: 'aktivitaeten',
        loadChildren: () =>
          import('./features/aktivitaet/aktivitaet.routes').then((m) => m.AKTIVITAET_ROUTES),
      },
      {
        path: 'vertraege',
        canActivate: [permissionGuard('VERTRAEGE')],
        loadChildren: () =>
          import('./features/vertrag/vertrag.routes').then((m) => m.VERTRAG_ROUTES),
      },
      {
        path: 'produkte',
        canActivate: [permissionGuard('PRODUKTE')],
        loadChildren: () =>
          import('./features/produkt/produkt.routes').then((m) => m.PRODUKT_ROUTES),
      },
      {
        path: 'chancen',
        canActivate: [permissionGuard('CHANCEN')],
        loadChildren: () => import('./features/chance/chance.routes').then((m) => m.CHANCE_ROUTES),
      },
      {
        path: 'auswertungen',
        canActivate: [permissionGuard('AUSWERTUNGEN')],
        loadChildren: () =>
          import('./features/auswertung/auswertung.routes').then((m) => m.AUSWERTUNG_ROUTES),
      },
    ],
  },
  { path: '**', redirectTo: 'welcome' },
];
