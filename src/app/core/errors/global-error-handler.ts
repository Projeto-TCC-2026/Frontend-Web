import { ErrorHandler, Injectable, Injector, NgZone, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NotificationService } from '../services/notification.service';

/**
 * Catches uncaught client-side errors that never reached an HTTP subscriber.
 *
 * HttpErrorResponse instances are ignored here: they are already handled by
 * the error.interceptor, so surfacing them again would double-notify.
 * NotificationService is resolved lazily to avoid circular DI during bootstrap.
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {

  private readonly injector = inject(Injector);

  public handleError(error: unknown): void {
    console.error('[GlobalErrorHandler]', error);

    if (error instanceof HttpErrorResponse) {
      return;
    }

    const notifications = this.injector.get(NotificationService);
    const zone = this.injector.get(NgZone);
    zone.run(() => notifications.error('Ocorreu um erro inesperado.'));
  }
}
