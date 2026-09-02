import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { apiErrorInterceptor } from './core/interceptors/api-error.interceptor';
import { AuthService } from './core/services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, apiErrorInterceptor])),
    provideAppInitializer(async () => {
      // Public pages (feedback form, QR page, thank-you) must work without a
      // backend and without a login. Skipping session recovery there keeps the
      // app from firing /api/auth/me — which on a frontend-only deployment
      // would surface as an error notification on an otherwise public page.
      const publicRoutes = ['/feedback', '/feedback-qr', '/danke'];
      if (publicRoutes.some((r) => window.location.pathname.startsWith(r))) {
        return;
      }
      const authService = inject(AuthService);
      try {
        await firstValueFrom(authService.initializeAuth());
      } catch {
        // App should start even if session recovery fails
      }
    }),
  ],
};
