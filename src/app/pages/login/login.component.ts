import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { LoginRequest } from '../../core/models/dtos/auth.dto';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { LucideChevronLeft } from '@lucide/angular';
import { InputComponent } from '../../shared/components/input/input.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, LucideChevronLeft, InputComponent],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  public email: string = '';
  public password: string = '';
  public isSubmitting: boolean = false;

  public onSubmit(): void {
    if (!this.email || !this.password) {
      this.notificationService.error('Preencha seu e-mail e senha para entrar.');
      return;
    }

    this.isSubmitting = true;

    const credentials: LoginRequest = {
      email: this.email,
      password: this.password,
    };

    this.authService.login(credentials).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.notificationService.success('Login realizado com sucesso.');
        this.router.navigate(['/app/dashboard']);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.notificationService.error(error.message || 'Não foi possível entrar. Tente novamente.');
      },
    });
  }

  public goToForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }

  public goToHome(): void {
    this.router.navigate(['/']);
  }

  public goToRegister(): void {
    this.router.navigate(['/cadastro']);
  }
}
