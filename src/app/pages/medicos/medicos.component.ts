import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LucidePlus, LucideSearch, LucidePencil, LucideTrash2 } from '@lucide/angular';

import { DoctorService, SaveDoctorRequest } from '../../core/services/doctor.service';
import { Doctor } from '../../core/models/entities/doctor.model';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { DialogService } from '../../core/services/dialog.service';

import { ButtonComponent } from '../../shared/components/button/button.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { DialogComponent } from '../../shared/components/dialog/dialog.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

type FormMode = 'create' | 'edit';

@Component({
  selector: 'app-medicos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonComponent,
    InputComponent,
    DialogComponent,
    LoadingComponent,
    EmptyStateComponent,
    LucidePlus,
    LucideSearch,
    LucidePencil,
    LucideTrash2,
  ],
  templateUrl: './medicos.component.html',
})
export class MedicosComponent implements OnInit {
  private doctorService = inject(DoctorService);
  private authService = inject(AuthService);
  private notify = inject(NotificationService);
  private dialogService = inject(DialogService);
  private fb = inject(FormBuilder);

  protected doctors = signal<Doctor[]>([]);
  protected loading = signal(true);
  protected searchTerm = signal('');
  protected formOpen = signal(false);
  protected formMode = signal<FormMode>('create');
  protected formLoading = signal(false);
  protected editingId = signal<number | null>(null);

  protected filteredDoctors = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.doctors();
    return this.doctors().filter(d =>
      d.fullName.toLowerCase().includes(term) ||
      d.crm.toLowerCase().includes(term) ||
      d.specialty.toLowerCase().includes(term)
    );
  });

  protected form = this.fb.group({
    fullName:  ['', [Validators.required, Validators.minLength(3)]],
    cpf:       ['', [Validators.required]],
    crm:       ['', [Validators.required]],
    specialty: ['', [Validators.required]],
    phone:     ['', [Validators.required]],
  });

  ngOnInit(): void {
    this.loadDoctors();
  }

  private loadDoctors(): void {
    this.loading.set(true);
    this.doctorService.getAll().subscribe({
      next: (page) => {
        this.doctors.set(page.content);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected openCreate(): void {
    this.formMode.set('create');
    this.editingId.set(null);
    this.form.reset();
    this.form.get('cpf')?.enable();
    this.form.get('crm')?.enable();
    this.formOpen.set(true);
  }

  protected openEdit(doctor: Doctor): void {
    this.formMode.set('edit');
    this.editingId.set(doctor.id);
    this.form.patchValue({
      fullName: doctor.fullName,
      cpf: doctor.cpf,
      crm: doctor.crm,
      specialty: doctor.specialty,
      phone: doctor.phone,
    });
    this.form.get('cpf')?.disable();
    this.form.get('crm')?.disable();
    this.formOpen.set(true);
  }

  protected closeForm(): void {
    this.formOpen.set(false);
  }

  protected onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.formLoading.set(true);

    const raw = this.form.getRawValue();
    const user = this.authService.getCurrentUser();

    const body: SaveDoctorRequest = {
      userId: 0,
      hospitalId: user?.id ? Number(user.id) : 0,
      fullName: raw.fullName!,
      cpf: raw.cpf!,
      crm: raw.crm!,
      specialty: raw.specialty!,
      phone: raw.phone!,
    };

    if (this.formMode() === 'create') {
      this.doctorService.create(body).subscribe({
        next: (doctor) => {
          this.doctors.update(list => [...list, doctor]);
          this.notify.success('Médico cadastrado com sucesso!');
          this.formLoading.set(false);
          this.formOpen.set(false);
        },
        error: () => this.formLoading.set(false),
      });
    } else {
      this.doctorService.update(this.editingId()!, body).subscribe({
        next: (updated) => {
          this.doctors.update(list => list.map(d => d.id === updated.id ? updated : d));
          this.notify.success('Médico atualizado com sucesso!');
          this.formLoading.set(false);
          this.formOpen.set(false);
        },
        error: () => this.formLoading.set(false),
      });
    }
  }

  protected async onDelete(doctor: Doctor): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title: 'Excluir médico?',
      message: `Deseja excluir ${doctor.fullName}? Esta ação não pode ser desfeita.`,
      confirmLabel: 'Excluir',
      cancelLabel: 'Cancelar',
      variant: 'destructive',
    });

    if (!confirmed) return;

    this.doctorService.delete(doctor.id).subscribe({
      next: () => {
        this.doctors.update(list => list.filter(d => d.id !== doctor.id));
        this.notify.success('Médico excluído com sucesso!');
      },
    });
  }

  protected onSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  protected isFieldInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }
}
