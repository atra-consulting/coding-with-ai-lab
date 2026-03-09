import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

export function permissionGuard(permission: string): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const notification = inject(NotificationService);
    const translate = inject(TranslateService);

    if (authService.hasPermission(permission)) {
      return true;
    }

    notification.error(translate.instant('AUTH.ACCESS_DENIED'));
    router.navigate(['/dashboard']);
    return false;
  };
}
