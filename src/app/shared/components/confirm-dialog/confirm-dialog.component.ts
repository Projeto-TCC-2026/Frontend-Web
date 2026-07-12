import { Component, inject } from '@angular/core';
import { DialogService } from '../../../core/services/dialog.service';
import { DialogComponent } from '../dialog/dialog.component';
import { ButtonComponent } from '../button/button.component';

/**
 * Global confirm dialog driven by DialogService.
 * Place once in the app (e.g. in MainLayout or AppComponent).
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [DialogComponent, ButtonComponent],
  templateUrl: './confirm-dialog.component.html',
})
export class ConfirmDialogComponent {
  protected dialog = inject(DialogService);

  protected onConfirm(): void {
    this.dialog.resolve(true);
  }

  protected onCancel(): void {
    this.dialog.resolve(false);
  }
}
