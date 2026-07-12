import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  cpf: string = '';
  password: string = '';
  forgotCpf: string = '';
  showForgotBox: boolean = false;
  showSuccessMessage: boolean = false;

  constructor(private router: Router) {}

  ngOnInit(): void {}

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

  onCpfInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = this.formatCPF(input.value);
    this.cpf = input.value;
  }

  onForgotCpfInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = this.formatCPF(input.value);
    this.forgotCpf = input.value;
  }

  toggleForgotBox(event: Event): void {
    event.preventDefault();
    this.showForgotBox = !this.showForgotBox;
  }

  sendRecovery(): void {
    if (!this.forgotCpf) { alert('Por favor, informe seu CPF.'); return; }
    if (!this.isValidCPF(this.forgotCpf)) { alert('Por favor, informe um CPF válido.'); return; }
    this.showSuccessMessage = true;
    this.forgotCpf = '';
    setTimeout(() => {
      this.showSuccessMessage = false;
      this.showForgotBox = false;
    }, 3000);
  }

  onSubmit(): void {
    if (!this.cpf || !this.password) { alert('Por favor, preencha todos os campos.'); return; }
    if (!this.isValidCPF(this.cpf)) { alert('Por favor, informe um CPF válido.'); return; }
    if (this.password.length < 6) { alert('A senha deve ter pelo menos 6 caracteres.'); return; }
    alert('Login realizado com sucesso! Redirecionando...');
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }

  goToRegister(): void {
    this.router.navigate(['/cadastro']);
  }
}
