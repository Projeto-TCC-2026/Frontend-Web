import { Component } from '@angular/core';

/**
 * Confirmação exibida ao paciente depois de definir a senha, no lugar do
 * formulário. Não oferece link para o painel web: o paciente acessa o sistema
 * pelo aplicativo.
 */
@Component({
  selector: 'app-password-set-success',
  standalone: true,
  templateUrl: './password-set-success.component.html',
})
export class PasswordSetSuccessComponent {}
