import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  const safeUrl = state.url.startsWith('/') && !state.url.startsWith('//') ? state.url : '/';
  router.navigate(['/welcome']);
  return false;
};
