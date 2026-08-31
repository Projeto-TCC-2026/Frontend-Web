import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import {
  LucidePlus,
  LucidePencil,
  LucideTrash2,
  LucideEye,
  LucideX,
  LucideSearch,
  LucideChevronLeft,
  LucideChevronRight,
} from '@lucide/angular';

import { PatientService, PaginatedResponse } from '../../core/services/patient.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { DialogService } from '../../core/services/dialog.service';
import { Patient, PatientListItem, PatientCreateRequest, Gender, BloodType } from '../../core/models/entities/patient.model';
import { UserRole } from '../../core/models/entities/user.model';

import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { DialogComponent } from '../../shared/components/dialog/dialog.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { SelectComponent, SelectOption } from '../../shared/components/select/select.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

type FormMode = 'create' | 'edit';

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LoadingComponent,
    DialogComponent,
    ButtonComponent,
    InputComponent,
    SelectComponent,
    EmptyStateComponent,
    LucidePlus,
    LucidePencil,
    LucideTrash2,
    LucideEye,
    LucideX,
    LucideSearch,
    LucideChevronLeft,
    LucideChevronRight,
  ],
  templateUrl: './patients.component.html',
})
export class PatientsComponent implements OnInit {
  private patientService = inject(PatientService);
  private authService = inject(AuthService);
  private notify = inject(NotificationService);
  private dialogService = inject(DialogService);
  private fb = inject(FormBuilder);

  protected patients = signal<PatientListItem[]>([]);
  protected loading = signal(true);
  protected saving = signal(false);
  protected selectedPatient = signal<Patient | null>(null);
  protected searchTerm = signal('');

  protected showViewModal = signal(false);
  protected formOpen = signal(false);
  protected formMode = signal<FormMode>('create');
  protected editingId = signal<string | null>(null);

  protected pageIndex = signal(0);
  protected totalPages = signal(0);
  protected totalElements = signal(0);
  protected pageSize = signal(10);

  protected userRole = signal<UserRole | null>(null);

  protected genderOptions: SelectOption[] = [
    { value: '', label: 'Não informado' },
    { value: 'MALE', label: 'Masculino' },
    { value: 'FEMALE', label: 'Feminino' },
    { value: 'OTHER', label: 'Outro' },
  ];

  protected bloodTypeOptions: SelectOption[] = [
    { value: '', label: 'Não informado' },
    { value: 'A_POSITIVE', label: 'A+' },
    { value: 'A_NEGATIVE', label: 'A-' },
    { value: 'B_POSITIVE', label: 'B+' },
    { value: 'B_NEGATIVE', label: 'B-' },
    { value: 'AB_POSITIVE', label: 'AB+' },
    { value: 'AB_NEGATIVE', label: 'AB-' },
    { value: 'O_POSITIVE', label: 'O+' },
    { value: 'O_NEGATIVE', label: 'O-' },
  ];

  protected pageSubtitle = computed(() => {
    switch (this.userRole()) {
      case 'ADMIN':
        return 'Gerencie os pacientes de todos os hospitais da plataforma';
      case 'HOSPITAL':
        return 'Gerencie os pacientes do seu hospital';
      default:
        return 'Gerencie os pacientes sob sua responsabilidade';
    }
  });

  protected canCreate = computed(() => {
    const role = this.userRole();
    return role === 'ADMIN' || role === 'HOSPITAL' || role === 'DOCTOR';
  });

  protected canEdit = computed(() => {
    const role = this.userRole();
    return role === 'ADMIN' || role === 'HOSPITAL' || role === 'DOCTOR';
  });

  protected canDelete = computed(() => this.userRole() === 'ADMIN');

  protected canDeactivate = computed(() => {
    const role = this.userRole();
    return role === 'ADMIN' || role === 'HOSPITAL' || role === 'DOCTOR';
  });

  protected filteredPatients = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.patients();
    return this.patients().filter(p =>
      p.fullName.toLowerCase().includes(term) ||
      p.cpf.toLowerCase().includes(term) ||
      (p.email ?? '').toLowerCase().includes(term) ||
      (p.phone ?? '').toLowerCase().includes(term) ||
      (p.city ?? '').toLowerCase().includes(term)
    );
  });

  protected patientForm = this.fb.group({
    userId: ['', Validators.required],
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    cpf: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
    birthDate: ['', Validators.required],
    gender: [''],
    bloodType: [''],
    phone: [''],
    email: ['', Validators.email],
    address: [''],
    city: [''],
    state: ['', Validators.pattern(/^[A-Z]{2}$/)],
    zipCode: ['', Validators.pattern(/^\d{8}$/)],
    weight: [null as number | null, [Validators.min(1), Validators.max(500)]],
    height: [null as number | null, [Validators.min(0.5), Validators.max(3.0)]],
  });

  ngOnInit(): void {
    this.userRole.set(this.authService.getRole());
    this.loadPatients();
  }

  private loadPatients(page = this.pageIndex()): void {
    this.loading.set(true);

    this.patientService.getAll(page, this.pageSize()).subscribe({
      next: (response: PaginatedResponse<PatientListItem>) => {
        this.patients.set(response.content);
        this.pageIndex.set(response.number);
        this.totalPages.set(response.totalPages);
        this.totalElements.set(response.totalElements);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.notify.error('Erro ao carregar pacientes: ' + (error.message || 'Erro desconhecido'));
      },
    });
  }

  protected onSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  protected goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages() || page === this.pageIndex()) return;
    this.loadPatients(page);
  }

  protected openCreate(): void {
    this.formMode.set('create');
    this.editingId.set(null);
    this.patientForm.reset();
    this.patientForm.get('cpf')?.enable();
    this.formOpen.set(true);
  }

  protected openEdit(patient: PatientListItem): void {
    this.patientService.getById(patient.id).subscribe({
      next: (full) => {
        this.formMode.set('edit');
        this.editingId.set(full.id);
        this.patientForm.patchValue({
          userId: full.userId ?? '',
          fullName: full.fullName,
          cpf: full.cpf,
          birthDate: full.birthDate?.substring(0, 10) ?? '',
          gender: full.gender ?? '',
          bloodType: full.bloodType ?? '',
          phone: full.phone ?? '',
          email: full.email ?? '',
          address: full.address ?? '',
          city: full.city ?? '',
          state: full.state ?? '',
          zipCode: full.zipCode ?? '',
          weight: full.weight ?? null,
          height: full.height ?? null,
        });
        this.patientForm.get('cpf')?.disable();
        this.formOpen.set(true);
      },
      error: (error) => {
        this.notify.error('Erro ao carregar paciente: ' + (error.message || 'Erro desconhecido'));
      },
    });
  }

  protected closeForm(): void {
    this.formOpen.set(false);
    this.patientForm.reset();
    this.patientForm.get('cpf')?.enable();
  }

  protected onSubmit(): void {
    if (this.patientForm.invalid) {
      this.patientForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const formValue = this.patientForm.getRawValue();

    const request: PatientCreateRequest = {
      userId: formValue.userId!,
      fullName: formValue.fullName!,
      cpf: formValue.cpf!,
      birthDate: formValue.birthDate!,
      gender: (formValue.gender as Gender) || undefined,
      bloodType: (formValue.bloodType as BloodType) || undefined,
      phone: formValue.phone || undefined,
      email: formValue.email || undefined,
      address: formValue.address || undefined,
      city: formValue.city || undefined,
      state: formValue.state || undefined,
      zipCode: formValue.zipCode || undefined,
      weight: formValue.weight ? Number(formValue.weight) : undefined,
      height: formValue.height ? Number(formValue.height) : undefined,
    };

    const isEdit = this.formMode() === 'edit';
    const call = isEdit
      ? this.patientService.update(this.editingId()!, request)
      : this.patientService.create(request);

    call.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.notify.success(isEdit ? 'Paciente atualizado com sucesso!' : 'Paciente cadastrado com sucesso!');
        this.loadPatients(isEdit ? this.pageIndex() : 0);
      },
      error: (error) => {
        this.saving.set(false);
        this.notify.error(`Erro ao ${isEdit ? 'atualizar' : 'cadastrar'} paciente: ` + (error.message || 'Erro desconhecido'));
      },
    });
  }

  protected viewPatient(patient: PatientListItem): void {
    this.patientService.getById(patient.id).subscribe({
      next: (fullPatient) => {
        this.selectedPatient.set(fullPatient);
        this.showViewModal.set(true);
      },
      error: (error) => {
        this.notify.error('Erro ao carregar paciente: ' + (error.message || 'Erro desconhecido'));
      },
    });
  }

  protected closeViewModal(): void {
    this.showViewModal.set(false);
    this.selectedPatient.set(null);
  }

  protected async deactivatePatient(patient: PatientListItem): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title: 'Inativar paciente?',
      message: `Deseja inativar ${patient.fullName}? Ele deixará de aparecer na listagem ativa.`,
      confirmLabel: 'Inativar',
      cancelLabel: 'Cancelar',
      variant: 'destructive',
    });

    if (!confirmed) return;

    this.patientService.deactivate(patient.id).subscribe({
      next: () => {
        this.notify.success(`Paciente ${patient.fullName} inativado com sucesso!`);
        this.loadPatients(this.patients().length === 1 && this.pageIndex() > 0 ? this.pageIndex() - 1 : this.pageIndex());
      },
      error: (error) => {
        this.notify.error('Erro ao inativar paciente: ' + (error.message || 'Erro desconhecido'));
      },
    });
  }

  protected async deletePatient(patient: PatientListItem): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title: 'Excluir paciente?',
      message: `Deseja excluir ${patient.fullName}? Esta ação não pode ser desfeita.`,
      confirmLabel: 'Excluir',
      cancelLabel: 'Cancelar',
      variant: 'destructive',
    });

    if (!confirmed) return;

    this.patientService.delete(patient.id).subscribe({
      next: () => {
        this.notify.success(`Paciente ${patient.fullName} excluído com sucesso!`);
        this.loadPatients(this.patients().length === 1 && this.pageIndex() > 0 ? this.pageIndex() - 1 : this.pageIndex());
      },
      error: (error) => {
        this.notify.error('Erro ao excluir paciente: ' + (error.message || 'Erro desconhecido'));
      },
    });
  }

  protected isFieldInvalid(field: string): boolean {
    const ctrl = this.patientForm.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  protected formatCPF(value: string): string {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  }

  protected formatPhone(value: string): string {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4,5})(\d{4})/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  }

  protected formatZipCode(value: string): string {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{3})\d+?$/, '$1');
  }

  protected getGenderLabel(gender: Gender): string {
    switch (gender) {
      case 'MALE': return 'Masculino';
      case 'FEMALE': return 'Feminino';
      case 'OTHER': return 'Outro';
      default: return 'Não informado';
    }
  }

  protected getBloodTypeLabel(bloodType: BloodType): string {
    const labels: Record<BloodType, string> = {
      A_POSITIVE: 'A+',
      A_NEGATIVE: 'A-',
      B_POSITIVE: 'B+',
      B_NEGATIVE: 'B-',
      AB_POSITIVE: 'AB+',
      AB_NEGATIVE: 'AB-',
      O_POSITIVE: 'O+',
      O_NEGATIVE: 'O-',
    };
    return labels[bloodType] ?? 'Não informado';
  }

  protected calculateAge(birthDate: string): number {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  }
}
