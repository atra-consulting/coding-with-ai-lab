import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const permissionGuard =
  (...requiredPermissions: string[]): CanActivateFn =>
  () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = authService.currentUser();

    if (user && requiredPermissions.some((p) => user.permissions.includes(p))) {
      return true;
    }

    router.navigate(['/dashboard']);
    return false;
  };
