import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const notification = inject(NotificationService);
  const router = inject(Router);

  const authReq = req.clone({ withCredentials: true });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        router.navigate(['/login']);
        return throwError(() => error);
      }
      if (error.status === 403) {
        notification.error('Zugriff verweigert');
        return throwError(() => error);
      }
      return throwError(() => error);
    }),
  );
};
