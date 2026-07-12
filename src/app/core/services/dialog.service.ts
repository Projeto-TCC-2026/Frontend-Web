import { Injectable, signal, computed } from '@angular/core';

export interface DialogConfig {
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
}

/**
 * Lightweight service for programmatic confirm dialogs.
 * For complex dialogs with custom content, use <app-dialog> directly in the template.
 */
@Injectable({ providedIn: 'root' })
export class DialogService {
  private _config = signal<DialogConfig | null>(null);
  private _resolver: ((confirmed: boolean) => void) | null = null;

  readonly config = computed(() => this._config());
  readonly isOpen = computed(() => this._config() !== null);

  /**
   * Opens a confirm dialog and returns a promise that resolves to true (confirmed) or false (cancelled).
   */
  confirm(config: DialogConfig): Promise<boolean> {
    this._config.set({
      title: config.title ?? 'Confirmação',
      message: config.message ?? 'Deseja continuar?',
      confirmLabel: config.confirmLabel ?? 'Confirmar',
      cancelLabel: config.cancelLabel ?? 'Cancelar',
      variant: config.variant ?? 'default',
    });

    return new Promise<boolean>((resolve) => {
      this._resolver = resolve;
    });
  }

  /** Called by the confirm dialog component */
  resolve(confirmed: boolean): void {
    this._resolver?.(confirmed);
    this._resolver = null;
    this._config.set(null);
  }
}
