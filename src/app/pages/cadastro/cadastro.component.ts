import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { LucideChevronLeft } from '@lucide/angular';

import { HospitalService, HospitalRegisterRequest } from '../../core/services/hospital.service';
import { NotificationService } from '../../core/services/notification.service';

import { ButtonComponent } from '../../shared/components/button/button.component';
import { InputComponent } from '../../shared/components/input/input.component';

/** Garante que confirmPassword seja igual a password. */
function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  if (password && confirmPassword && password !== confirmPassword) {
    group.get('confirmPassword')?.setErrors({ mismatch: true });
    return { mismatch: true };
  }
  return null;
}

/** Cadastro público — exclusivo para hospitais. Demais perfis não têm auto-cadastro. */
@Component({
  selector: 'app-cadastro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, InputComponent, LucideChevronLeft],
  templateUrl: './cadastro.component.html',
})
export class CadastroComponent {
  private hospitalService = inject(HospitalService);
  private notify = inject(NotificationService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  protected submitting = signal(false);

  protected form: FormGroup = this.fb.group(
    {
      name: ['', [Validators.required, Validators.minLength(3)]],
      cnpj: ['', [Validators.required, this.cnpjValidator]],
      phone: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      address: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required, Validators.pattern(/^[A-Za-z]{2}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatchValidator }
  );

  private cnpjValidator(control: AbstractControl): ValidationErrors | null {
    const digits = (control.value ?? '').replace(/\D/g, '');
    return digits.length === 14 ? null : { invalidCnpj: true };
  }

  protected onCnpjInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.form.get('cnpj')?.setValue(this.formatCnpj(raw));
  }

  protected onPhoneInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.form.get('phone')?.setValue(this.formatPhone(raw));
  }

  private formatCnpj(value: string): string {
    return value
      .replace(/\D/g, '')
      .slice(0, 14)
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }

  private formatPhone(value: string): string {
    return value
      .replace(/\D/g, '')
      .slice(0, 11)
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  }

  protected isFieldInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const raw = this.form.getRawValue();

    const body: HospitalRegisterRequest = {
      name: raw.name!,
      cnpj: (raw.cnpj as string).replace(/\D/g, ''),
      phone: raw.phone!,
      email: raw.email!,
      address: raw.address!,
      city: raw.city!,
      state: (raw.state as string).toUpperCase(),
      password: raw.password!,
    };

    this.hospitalService.register(body).subscribe({
      next: () => {
        this.submitting.set(false);
        this.notify.success('Cadastro realizado! Aguarde a aprovação de um administrador para acessar a plataforma.');
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.submitting.set(false);
        this.notify.error(error.message || 'Não foi possível concluir o cadastro. Tente novamente.');
      },
    });
  }

  protected goToLogin(): void {
    this.router.navigate(['/login']);
  }

  protected goToHome(): void {
    this.router.navigate(['/']);
  }
}
