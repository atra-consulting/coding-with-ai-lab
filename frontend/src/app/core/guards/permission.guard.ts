import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

export function permissionGuard(permission: string): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const notification = inject(NotificationService);

    if (authService.hasPermission(permission)) {
      return true;
    }

    notification.error('Zugriff verweigert');
    router.navigate(['/dashboard']);
    return false;
  };
}
