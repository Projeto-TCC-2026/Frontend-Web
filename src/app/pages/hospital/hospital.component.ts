import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LucidePencil, LucideX, LucideBuilding2 } from '@lucide/angular';

import { HospitalService } from '../../core/services/hospital.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { Hospital } from '../../core/models/entities/hospital.model';

import { ButtonComponent } from '../../shared/components/button/button.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';

@Component({
  selector: 'app-hospital',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonComponent,
    InputComponent,
    LoadingComponent,
    LucidePencil,
    LucideX,
    LucideBuilding2,
  ],
  templateUrl: './hospital.component.html',
})
export class HospitalComponent implements OnInit {
  private hospitalService = inject(HospitalService);
  private authService = inject(AuthService);
  private notify = inject(NotificationService);
  private fb = inject(FormBuilder);

  protected hospital = signal<Hospital | null>(null);
  protected loading = signal(true);
  protected editing = signal(false);
  protected saving = signal(false);

  protected form = this.fb.group({
    name:    ['', [Validators.required, Validators.minLength(3)]],
    email:   ['', [Validators.required, Validators.email]],
    phone:   ['', [Validators.required]],
    address: ['', [Validators.required]],
    city:    ['', [Validators.required]],
    state:   ['', [Validators.required]],
  });

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    // Hospital logado usa o endpoint do portal (resolve pelo token)
    if (user.role === 'HOSPITAL') {
      this.hospitalService.getOwnProfile().subscribe({
        next: (data) => {
          this.hospital.set(data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    } else if (user.hospitalId) {
      this.hospitalService.getById(user.hospitalId).subscribe({
        next: (data) => {
          this.hospital.set(data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    } else {
      this.loading.set(false);
    }
  }

  protected startEditing(): void {
    const h = this.hospital();
    if (!h) return;
    this.form.patchValue({
      name: h.name,
      email: h.email,
      phone: h.phone,
      address: h.address,
      city: h.city,
      state: h.state,
    });
    this.editing.set(true);
  }

  protected cancelEditing(): void {
    this.editing.set(false);
    this.form.reset();
  }

  protected onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.saving.set(true);
    const user = this.authService.getCurrentUser();
    const h = this.hospital();
    const raw = this.form.getRawValue();
    const body = {
      name:    raw.name!,
      cnpj:    h?.cnpj ?? '',
      email:   raw.email!,
      phone:   raw.phone!,
      address: raw.address!,
      city:    raw.city!,
      state:   raw.state!,
    };

    const update$ = user?.role === 'HOSPITAL'
      ? this.hospitalService.updateOwnProfile(body)
      : this.hospitalService.update(user!.hospitalId!, body);

    update$.subscribe({
      next: (updated) => {
        this.hospital.set(updated);
        this.saving.set(false);
        this.editing.set(false);
        this.notify.success('Dados atualizados com sucesso!');
      },
      error: () => this.saving.set(false),
    });
  }

  protected isFieldInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }
}
