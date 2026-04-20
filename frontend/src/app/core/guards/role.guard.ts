import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard =
  (...requiredRoles: string[]): CanActivateFn =>
  () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = authService.currentUser();

    if (user && requiredRoles.some((r) => user.rollen.includes(r))) {
      return true;
    }

    router.navigate(['/dashboard']);
    return false;
  };
