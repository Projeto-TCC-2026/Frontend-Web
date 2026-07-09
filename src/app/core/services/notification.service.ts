import { Injectable, inject } from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { BehaviorSubject, Observable } from 'rxjs';
import { ToastContainerComponent } from '../../shared/components/toast/toast-container.component';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

const DEFAULT_DURATION = 4000;
const ERROR_DURATION = 6000;

/**
 * App-wide toast notifications rendered through a single CDK overlay.
 *
 * The overlay + container are created lazily on first use; the container
 * subscribes to `toasts$` and renders the stack. Auto-dismiss is handled here.
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private readonly overlay = inject(Overlay);
  private overlayRef?: OverlayRef;
  private nextId = 0;

  private readonly toastsSubject = new BehaviorSubject<Toast[]>([]);
  readonly toasts$: Observable<Toast[]> = this.toastsSubject.asObservable();

  public success(message: string, duration = DEFAULT_DURATION): void {
    this.show('success', message, duration);
  }

  public error(message: string, duration = ERROR_DURATION): void {
    this.show('error', message, duration);
  }

  public warning(message: string, duration = DEFAULT_DURATION): void {
    this.show('warning', message, duration);
  }

  public info(message: string, duration = DEFAULT_DURATION): void {
    this.show('info', message, duration);
  }

  public dismiss(id: number): void {
    this.toastsSubject.next(this.toastsSubject.value.filter(toast => toast.id !== id));
  }

  private show(type: ToastType, message: string, duration: number): void {
    this.ensureOverlay();
    const toast: Toast = { id: ++this.nextId, type, message };
    this.toastsSubject.next([...this.toastsSubject.value, toast]);
    if (duration > 0) {
      setTimeout(() => this.dismiss(toast.id), duration);
    }
  }

  private ensureOverlay(): void {
    if (this.overlayRef) {
      return;
    }
    this.overlayRef = this.overlay.create({
      positionStrategy: this.overlay.position().global().top('1rem').right('1rem'),
      hasBackdrop: false
    });
    this.overlayRef.attach(new ComponentPortal(ToastContainerComponent));
  }
}
