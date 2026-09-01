import { Component, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, InputComponent],
  templateUrl: './change-password.component.html',
})
export class ChangePasswordComponent {
  private readonly authService = inject(AuthService);
  private readonly notify = inject(NotificationService);
  private readonly location = inject(Location);

  protected currentPassword = '';
  protected newPassword = '';
  protected passwordConfirmation = '';
  protected isSubmitting = false;

  protected goBack(): void {
    this.location.back();
  }

  protected onSubmit(): void {
    if (!this.currentPassword || !this.newPassword || !this.passwordConfirmation) {
      this.notify.error('Preencha todos os campos.');
      return;
    }

    if (this.newPassword.length < 6) {
      this.notify.error('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (this.newPassword !== this.passwordConfirmation) {
      this.notify.error('A confirmação de senha não confere.');
      return;
    }

    if (this.currentPassword === this.newPassword) {
      this.notify.error('A nova senha deve ser diferente da senha atual.');
      return;
    }

    this.isSubmitting = true;

    this.authService.changePassword({
      currentPassword: this.currentPassword,
      newPassword: this.newPassword,
      confirmNewPassword: this.passwordConfirmation,
    }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.notify.success('Senha alterada com sucesso.');
        this.currentPassword = '';
        this.newPassword = '';
        this.passwordConfirmation = '';
      },
      error: (error) => {
        this.isSubmitting = false;
        this.notify.error(error.message || 'Não foi possível alterar a senha. Verifique a senha atual e tente novamente.');
      },
    });
  }
}
