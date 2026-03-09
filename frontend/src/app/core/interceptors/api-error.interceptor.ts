import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const notification = inject(NotificationService);
  const translate = inject(TranslateService);
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401 and 403 are handled by auth interceptor
      if (error.status === 401 || error.status === 403) {
        return throwError(() => error);
      }

      let message = translate.instant('ERRORS.UNKNOWN');
      if (error.error?.message) {
        message = error.error.message;
      } else if (error.status === 404) {
        message = translate.instant('ERRORS.NOT_FOUND');
      } else if (error.status === 400) {
        message = translate.instant('ERRORS.BAD_REQUEST');
      } else if (error.status === 0) {
        message = translate.instant('ERRORS.SERVER_UNREACHABLE');
      }
      notification.error(message);
      return throwError(() => error);
    }),
  );
};
