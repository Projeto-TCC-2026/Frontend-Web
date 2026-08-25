import { DialogComponent } from '../../shared/components/dialog/dialog.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { SelectComponent } from '../../shared/components/select/select.component';

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { 
  LucidePlus, 
  LucidePencil, 
  LucideTrash2, 
  LucideEye,
  LucideX,
  LucideUsers,
  LucideSearch,
  LucideFilter,
  LucideChevronLeft,
  LucideChevronRight
} from '@lucide/angular';

import { PatientService, PaginatedResponse } from '../../core/services/patient.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { Patient, PatientListItem, PatientCreateRequest, PatientFilters, Gender, BloodType } from '../../core/models/entities/patient.model';
import { UserRole } from '../../core/models/entities/user.model';

import { LoadingComponent } from '../../shared/components/loading/loading.component';
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
    LucidePlus,
    LucidePencil,
    LucideTrash2,
    LucideEye,
    LucideX,
    LucideUsers,
    LucideSearch,
    LucideFilter,
    LucideChevronLeft,
    LucideChevronRight,
  ],
  templateUrl: './patients.component.html',
})
export class PatientsComponent implements OnInit {
  private patientService = inject(PatientService);
  private authService = inject(AuthService);
  private notify = inject(NotificationService);
  private fb = inject(FormBuilder);

  // ========================================
  // State Management
  // ========================================
  protected patients = signal<PatientListItem[]>([]);
  protected loading = signal(true);
  protected saving = signal(false);
  protected selectedPatient = signal<Patient | null>(null);

  // Modals
  protected showViewModal = signal(false);
  protected formOpen = signal(false);
  protected formMode = signal<FormMode>('create');
  protected editingId = signal<string | null>(null);
  

  // Pagination
  protected currentPage = signal(0);
  protected totalPages = signal(0);
  protected totalElements = signal(0);
  protected pageSize = signal(10);

  // Filters
  protected searchTerm = signal('');
  protected searchType = signal<'name' | 'cpf' | 'email' | 'phone'>('name');
  protected showFilters = signal(false);
  protected activeFilters = signal<PatientFilters>({});

  // User role
  protected userRole = signal<UserRole | null>(null);

  protected hasActiveFilters = computed(() => {
    return Object.keys(this.activeFilters()).length > 0;
  });

  protected hasSearchOrFilters = computed(() => {
    return this.searchTerm().length > 0 || this.hasActiveFilters();
  });

  // ========================================
  // Computed Properties
  // ========================================
  protected canCreate = computed(() => {
    const role = this.userRole();
    return role === 'ADMIN' || role === 'DOCTOR';
  });

  protected canEdit = computed(() => {
    const role = this.userRole();
    return role === 'ADMIN' || role === 'DOCTOR';
  });

  protected canDelete = computed(() => {
    const role = this.userRole();
    return role === 'ADMIN'; // Only ADMIN can delete
  });

  protected canDeactivate = computed(() => {
    const role = this.userRole();
    return role === 'ADMIN' || role === 'DOCTOR';
  });

  protected hasResults = computed(() => this.patients().length > 0);
  protected showPagination = computed(() => this.totalPages() > 1);

  // ========================================
  // Forms
  // ========================================
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

  protected filterForm = this.fb.group({
    name: [''],
    gender: [''],
    city: [''],
    state: [''],
  });

  // ========================================
  // Lifecycle
  // ========================================
  ngOnInit(): void {
    this.userRole.set(this.authService.getRole());
    this.loadPatients();
  }

  // ========================================
  // Data Loading
  // ========================================
  private loadPatients(page = 0): void {
    this.loading.set(true);
    this.currentPage.set(page);

    const searchTerm = this.searchTerm();
    const filters = this.activeFilters();

    let request;

    if (searchTerm) {
      // Search by specific criteria
      const searchType = this.searchType();
      switch (searchType) {
        case 'name':
          request = this.patientService.searchByName(searchTerm, page, this.pageSize());
          break;
        case 'cpf':
          request = this.patientService.searchByCpf(searchTerm, page, this.pageSize());
          break;
        case 'email':
          request = this.patientService.searchByEmail(searchTerm, page, this.pageSize());
          break;
        case 'phone':
          request = this.patientService.searchByPhone(searchTerm, page, this.pageSize());
          break;
      }
    } else if (Object.keys(filters).length > 0 && filters.name || filters.gender || filters.city || filters.state) {
      // Apply filters
      request = this.patientService.filter({ 
        ...filters, 
        page, 
        size: this.pageSize() 
      });
    } else {
      // Default listing
      request = this.patientService.getAll(page, this.pageSize());
    }

    request.subscribe({
      next: (response: PaginatedResponse<PatientListItem>) => {
        this.patients.set(response.content);
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

  // ========================================
  // Search and Filters
  // ========================================
  protected onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
    this.activeFilters.set({}); // Clear filters when searching
    this.loadPatients(0);
  }

  protected onSearchTypeChange(type: 'name' | 'cpf' | 'email' | 'phone'): void {
    this.searchType.set(type);
    if (this.searchTerm()) {
      this.loadPatients(0);
    }
  }

  protected toggleFilters(): void {
    this.showFilters.set(!this.showFilters());
  }

  protected applyFilters(): void {
    const formValue = this.filterForm.getRawValue();
    const filters: PatientFilters = {};

    if (formValue.name) filters.name = formValue.name;
    if (formValue.gender) filters.gender = formValue.gender as Gender;
    if (formValue.city) filters.city = formValue.city;
    if (formValue.state) filters.state = formValue.state;

    this.activeFilters.set(filters);
    this.searchTerm.set(''); // Clear search when filtering
    this.loadPatients(0);
    this.showFilters.set(false);
  }

  protected clearFilters(): void {
    this.filterForm.reset();
    this.activeFilters.set({});
    this.searchTerm.set('');
    this.loadPatients(0);
    this.showFilters.set(false);
  }

  // ========================================
  // Pagination
  // ========================================
  protected goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.loadPatients(page);
    }
  }

  protected previousPage(): void {
    if (this.currentPage() > 0) {
      this.goToPage(this.currentPage() - 1);
    }
  }

  protected nextPage(): void {
    if (this.currentPage() < this.totalPages() - 1) {
      this.goToPage(this.currentPage() + 1);
    }
  }

  // ========================================
  // CRUD Operations
  // ========================================
  protected openCreate(): void {
    this.formMode.set('create');
    this.editingId.set(null);
    this.patientForm.reset();
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
        this.loadPatients(isEdit ? this.currentPage() : 0);
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

  protected deactivatePatient(patient: PatientListItem): void {
    if (confirm(`Tem certeza que deseja inativar o paciente "${patient.fullName}"?`)) {
      this.patientService.deactivate(patient.id).subscribe({
        next: () => {
          this.notify.success(`Paciente ${patient.fullName} inativado com sucesso!`);
          this.loadPatients(this.currentPage());
        },
        error: (error) => {
          this.notify.error('Erro ao inativar paciente: ' + (error.message || 'Erro desconhecido'));
        },
      });
    }
  }

  protected deletePatient(patient: PatientListItem): void {
    if (confirm(`Tem certeza que deseja excluir permanentemente o paciente "${patient.fullName}"? Esta ação não pode ser desfeita.`)) {
      this.patientService.delete(patient.id).subscribe({
        next: () => {
          this.notify.success(`Paciente ${patient.fullName} excluído com sucesso!`);
          this.loadPatients(this.currentPage());
        },
        error: (error) => {
          this.notify.error('Erro ao excluir paciente: ' + (error.message || 'Erro desconhecido'));
        },
      });
    }
  }

  // ========================================
  // Utilities
  // ========================================
  protected getPageNumbers(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i);
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

  protected onCpfInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = this.formatCPF(input.value);
  }

  protected formatPhone(value: string): string {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4,5})(\d{4})/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  }

  protected onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = this.formatPhone(input.value);
  }

  protected formatZipCode(value: string): string {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{3})\d+?$/, '$1');
  }

  protected onZipCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = this.formatZipCode(input.value);
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
    return bloodType ? bloodType.replace('_', '') : 'Não informado';
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