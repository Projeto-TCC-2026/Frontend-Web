import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { LoginRequest } from '../../core/models/dtos/auth.dto';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private notify = inject(NotificationService);

  email: string = '';
  password: string = '';
  forgotEmail: string = '';
  showForgotBox: boolean = false;
  showSuccessMessage: boolean = false;
  loading = signal(false);

  // Manter compatibilidade com CPF (legacy)
  cpf: string = '';
  forgotCpf: string = '';

  ngOnInit(): void {
    // Se já estiver logado, redirecionar para dashboard
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/app/dashboard']);
    }
  }

  formatCPF(value: string): string {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  }

  isValidCPF(cpf: string): boolean {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
    let sum = 0, remainder: number;
    for (let i = 1; i <= 9; i++) sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(9, 10))) return false;
    sum = 0;
    for (let i = 1; i <= 10; i++) sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(10, 11))) return false;
    return true;
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  onCpfInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = this.formatCPF(input.value);
    this.cpf = input.value;
    // Para compatibilidade, usar CPF como email temporariamente
    this.email = input.value;
  }

  onForgotCpfInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = this.formatCPF(input.value);
    this.forgotCpf = input.value;
    this.forgotEmail = input.value;
  }

  toggleForgotBox(event: Event): void {
    event.preventDefault();
    this.showForgotBox = !this.showForgotBox;
  }

  sendRecovery(): void {
    const emailToCheck = this.forgotEmail || this.forgotCpf;
    if (!emailToCheck) { 
      this.notify.error('Por favor, informe seu email ou CPF.');
      return; 
    }
    
    if (!this.isValidEmail(emailToCheck) && !this.isValidCPF(emailToCheck)) { 
      this.notify.error('Por favor, informe um email válido ou CPF válido.');
      return; 
    }
    
    this.showSuccessMessage = true;
    this.forgotEmail = '';
    this.forgotCpf = '';
    setTimeout(() => {
      this.showSuccessMessage = false;
      this.showForgotBox = false;
    }, 3000);
  }

  onSubmit(): void {
    // Suporte para CPF (legacy) ou Email
    const loginEmail = this.email || this.cpf;
    
    if (!loginEmail || !this.password) { 
      this.notify.error('Por favor, preencha todos os campos.');
      return; 
    }
    
    // Validação: aceita email válido ou CPF válido
    if (!this.isValidEmail(loginEmail) && !this.isValidCPF(loginEmail)) { 
      this.notify.error('Por favor, informe um email válido ou CPF válido.');
      return; 
    }
    
    if (this.password.length < 6) { 
      this.notify.error('A senha deve ter pelo menos 6 caracteres.');
      return; 
    }

    this.loading.set(true);

    const loginRequest: LoginRequest = {
      email: loginEmail,
      password: this.password
    };

    this.authService.login(loginRequest).subscribe({
      next: (user) => {
        this.loading.set(false);
        this.notify.success(`Bem-vindo, ${user.fullName || user.email}!`);
        this.router.navigate(['/app/dashboard']);
      },
      error: (error) => {
        this.loading.set(false);
        this.notify.error(error.message || 'Credenciais inválidas. Tente novamente.');
      }
    });
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }

  goToRegister(): void {
    this.router.navigate(['/cadastro']);
  }
}
