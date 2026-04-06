import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { EMPTY, catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const notification = inject(NotificationService);
  const router = inject(Router);

  const authReq = req.clone({ withCredentials: true });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        const publicRoutes = ['/login', '/welcome', '/feedback', '/feedback-qr', '/danke'];
        const currentUrl = router.url === '/' ? window.location.pathname : router.url;
        if (!publicRoutes.some((r) => currentUrl.startsWith(r))) {
          router.navigate(['/welcome']);
        }
        return EMPTY;
      }
      if (error.status === 403) {
        notification.error('Zugriff verweigert');
        return throwError(() => error);
      }
      return throwError(() => error);
    }),
  );
};
