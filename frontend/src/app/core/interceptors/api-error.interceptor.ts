import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const notification = inject(NotificationService);
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let message = 'Ein unbekannter Fehler ist aufgetreten';
      if (error.error?.message) {
        message = error.error.message;
      } else if (error.status === 404) {
        message = 'Ressource nicht gefunden';
      } else if (error.status === 400) {
        message = 'Ungültige Anfrage';
      } else if (error.status === 0) {
        message = 'Server nicht erreichbar';
      }
      notification.error(message);
      return throwError(() => error);
    }),
  );
};
