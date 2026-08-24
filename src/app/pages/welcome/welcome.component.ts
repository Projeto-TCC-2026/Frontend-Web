import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from '../../core/services/notification.service';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { ApiService } from '../../core/services/api.service';

/**
 * Tela de primeiro acesso: aberta a partir do link de boas-vindas enviado por
 * e-mail quando um Hospital cadastra um Doutor (ou um Doutor cadastra um
 * Paciente). Mesmo fluxo de ResetPasswordComponent, apontando para o endpoint
 * de ativação de conta em vez do de recuperação de senha.
 */
@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, InputComponent],
  templateUrl: './welcome.component.html',
})
export class WelcomeComponent {
  private readonly apiService = inject(ApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  public password = '';
  public passwordConfirmation = '';
  public isSubmitting = false;
  public token = '';

  constructor() {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
  }

  public onSubmit(): void {
    if (!this.token) {
      this.notificationService.error('O link de boas-vindas está inválido ou expirado.');
      return;
    }

    if (!this.password || !this.passwordConfirmation) {
      this.notificationService.error('Informe a senha e a confirmação.');
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

    this.apiService.post('/account-activation/activate', {
      token: this.token,
      password: this.password,
      passwordConfirmation: this.passwordConfirmation,
    }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.notificationService.success('Conta ativada com sucesso! Faça login com sua nova senha.');
        this.router.navigate(['/login']);
      },
      error: () => {
        this.isSubmitting = false;
        this.notificationService.error('Não foi possível ativar a conta. O link pode ter expirado.');
      },
    });
  }

  public goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
