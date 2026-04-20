import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'geocoding',
    canActivate: [roleGuard('ROLE_ADMIN')],
    loadComponent: () =>
      import('./admin-geocoding.component').then((m) => m.AdminGeocodingComponent),
  },
];
