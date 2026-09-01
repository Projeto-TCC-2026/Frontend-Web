import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { UserProfile } from '../../../core/models/entities/user.model';

@Component({
  selector: 'app-edit-account',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, InputComponent],
  templateUrl: './edit-account.component.html',
})
export class EditAccountComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly notify = inject(NotificationService);
  private readonly location = inject(Location);

  protected user: UserProfile | null = null;
  protected isSubmitting = false;

  // Hospital fields
  protected hospitalName = '';
  protected hospitalPhone = '';
  protected hospitalEmail = '';
  protected hospitalAddress = '';
  protected hospitalCity = '';
  protected hospitalState = '';

  // Doctor fields
  protected doctorFullName = '';
  protected doctorSpecialty = '';
  protected doctorPhone = '';

  protected get isHospital(): boolean {
    return this.user?.role === 'HOSPITAL';
  }

  protected get isDoctor(): boolean {
    return this.user?.role === 'DOCTOR';
  }

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.fillForm();
  }

  private fillForm(): void {
    if (!this.user) return;

    if (this.isHospital) {
      this.hospitalName = this.user.hospitalName ?? '';
      this.hospitalEmail = this.user.email ?? '';
    }

    if (this.isDoctor) {
      this.doctorFullName = this.user.fullName ?? '';
      this.doctorSpecialty = this.user.specialty ?? '';
    }
  }

  protected goBack(): void {
    this.location.back();
  }

  protected onSubmit(): void {
    if (this.isHospital) {
      if (!this.hospitalName || !this.hospitalPhone || !this.hospitalEmail || !this.hospitalAddress || !this.hospitalCity || !this.hospitalState) {
        this.notify.error('Preencha todos os campos obrigatórios.');
        return;
      }

      if (this.hospitalState.length !== 2) {
        this.notify.error('Informe a UF com 2 letras (ex: SP).');
        return;
      }

      this.isSubmitting = true;
      this.authService.updateProfile({
        name: this.hospitalName,
        phone: this.hospitalPhone,
        email: this.hospitalEmail,
        address: this.hospitalAddress,
        city: this.hospitalCity,
        state: this.hospitalState.toUpperCase(),
      }).subscribe({
        next: () => this.onSuccess(),
        error: (err) => this.onError(err),
      });
    }

    if (this.isDoctor) {
      if (!this.doctorFullName || !this.doctorSpecialty || !this.doctorPhone) {
        this.notify.error('Preencha todos os campos obrigatórios.');
        return;
      }

      this.isSubmitting = true;
      this.authService.updateProfile({
        fullName: this.doctorFullName,
        specialty: this.doctorSpecialty,
        phone: this.doctorPhone,
      }).subscribe({
        next: () => this.onSuccess(),
        error: (err) => this.onError(err),
      });
    }
  }

  private onSuccess(): void {
    this.isSubmitting = false;
    this.authService.fetchProfile().subscribe();
    this.notify.success('Informações atualizadas com sucesso.');
  }

  private onError(err: any): void {
    this.isSubmitting = false;
    this.notify.error(err.message || 'Não foi possível atualizar as informações. Tente novamente.');
  }
}
