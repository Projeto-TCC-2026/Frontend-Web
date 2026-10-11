import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from '../../core/services/notification.service';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { ApiService } from '../../core/services/api.service';
import { ApiEnvelope, UserRoleResponse } from '../../core/models/dtos/auth.dto';
import { PasswordSetSuccessComponent } from '../../shared/components/password-set-success/password-set-success.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    InputComponent,
    PasswordSetSuccessComponent,
  ],
  templateUrl: './reset-password.component.html',
})
export class ResetPasswordComponent {
  private readonly apiService = inject(ApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  public code = '';
  public password = '';
  public passwordConfirmation = '';
  public isSubmitting = false;
  /** Troca o formulário pela confirmação "Senha definida" (apenas paciente). */
  public isPasswordSet = false;

  constructor() {
    this.code = this.route.snapshot.queryParamMap.get('code') ??
      this.route.snapshot.queryParamMap.get('token') ?? '';
  }

  public onSubmit(): void {
    if (!this.code) {
      this.notificationService.error('Informe o código de verificação recebido por e-mail.');
      return;
    }

    if (!this.password || !this.passwordConfirmation) {
      this.notificationService.error('Informe a nova senha e a confirmação.');
      return;
    }

    if (this.password.length < 6) {
      this.notificationService.error('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (this.password !== this.passwordConfirmation) {
      this.notificationService.error('As senhas não conferem.');
      return;
    }

    this.isSubmitting = true;

    this.apiService.post<ApiEnvelope<UserRoleResponse>>('/forgot-password/reset', {
      code: this.code,
      token: this.code,
      password: this.password,
      passwordConfirmation: this.passwordConfirmation,
    }).subscribe({
      next: response => {
        this.isSubmitting = false;

        if (response?.data?.role === 'PATIENT') {
          this.isPasswordSet = true;
          return;
        }

        this.notificationService.success('Senha atualizada com sucesso.');
        this.router.navigate(['/login']);
      },
      error: (err: any) => {
        this.isSubmitting = false;
        const message = err?.error?.message ?? 'Não foi possível atualizar a senha. Tente novamente.';
        this.notificationService.error(message);
      },
    });
  }

  public goToHome(): void {
    this.router.navigate(['/']);
  }
}
