import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NotificationService } from '../services/notification.service';

/**
 * Global HTTP error policy:
 *  - 401  -> left untouched (auth.interceptor owns refresh/logout)
 *  - 403  -> redirect to /403
 *  - 400/422 -> passed through so the caller/form can show it inline (no toast)
 *  - 0 (network), 5xx, anything else -> generic toast
 * Every error is re-thrown so callers keep their own handling.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const notifications = inject(NotificationService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        handleHttpError(error, router, notifications);
      }
      return throwError(() => error);
    })
  );
};

function handleHttpError(
  error: HttpErrorResponse,
  router: Router,
  notifications: NotificationService
): void {
  const status = error.status;

  if (status === 401) {
    return; // handled by auth.interceptor
  }
  if (status === 403) {
    router.navigate(['/403']);
    return;
  }
  if (status === 400 || status === 422) {
    return; // validation errors are handled inline by the caller
  }

  notifications.error(defaultMessage(status));
}

function defaultMessage(status: number): string {
  if (status === 0) {
    return 'Falha de conexão. Verifique sua internet e tente novamente.';
  }
  if (status >= 500) {
    return 'Erro no servidor. Tente novamente em instantes.';
  }
  return 'Algo deu errado. Tente novamente.';
}
