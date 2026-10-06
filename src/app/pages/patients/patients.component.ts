import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import {
  LucidePlus,
  LucidePencil,
  LucideEye,
  LucideSearch,
  LucideChevronLeft,
  LucideChevronRight,
  LucideTrash2,
} from '@lucide/angular';

import { PatientService, PaginatedResponse } from '../../core/services/patient.service';
import { AuthService } from '../../core/services/auth.service';
import { DoctorService } from '../../core/services/doctor.service';
import { NotificationService } from '../../core/services/notification.service';
import { DialogService } from '../../core/services/dialog.service';
import { Procedure, ProcedureService } from '../../core/services/procedure.service';
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
    LucideEye,
    LucideSearch,
    LucideChevronLeft,
    LucideChevronRight,
    LucideTrash2,
  ],
  templateUrl: './patients.component.html',
})
export class PatientsComponent implements OnInit {
  private patientService = inject(PatientService);
  private authService = inject(AuthService);
  private doctorService = inject(DoctorService);
  private notify = inject(NotificationService);
  private dialogService = inject(DialogService);
  private procedureService = inject(ProcedureService);
  private fb = inject(FormBuilder);

  protected patients = signal<PatientListItem[]>([]);
  protected loading = signal(true);
  protected saving = signal(false);
  protected selectedPatient = signal<Patient | null>(null);
  protected responsibleDoctorName = signal<string | null>(null);
  protected searchTerm = signal('');
  protected statusFilter = signal<'all' | 'active' | 'inactive'>('active');
  protected statusOptions: SelectOption[] = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Ativos' },
    { value: 'inactive', label: 'Desativados' },
  ];

  protected showViewModal = signal(false);
  protected formOpen = signal(false);
  protected formMode = signal<FormMode>('create');
  protected editingId = signal<string | null>(null);

  protected pageIndex = signal(0);
  protected totalPages = signal(0);
  protected totalElements = signal(0);
  protected pageSize = signal(10);

  protected userRole = signal<UserRole | null>(null);

  /** O vínculo com médico só é informado pelo hospital; para DOCTOR o backend resolve pelo token. */
  protected isHospital = computed(() => this.userRole() === 'HOSPITAL');
  protected doctorOptions = signal<SelectOption[]>([]);
  protected loadingDoctors = signal(false);

  /** Procedimentos disponíveis para vincular no cadastro (só modo create). */
  protected procedureOptions = signal<SelectOption[]>([]);
  protected loadingProcedures = signal(false);
  /** Diferencia "ainda não buscou" de "buscou e veio vazio", para não mostrar a dica cedo demais. */
  protected proceduresLoaded = signal(false);

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
      case 'HOSPITAL':
        return 'Gerencie os pacientes do seu hospital';
      default:
        return 'Gerencie os pacientes sob sua responsabilidade';
    }
  });

  protected canCreate = computed(() => {
    const role = this.userRole();
    return role === 'HOSPITAL' || role === 'DOCTOR';
  });

  protected canEdit = computed(() => {
    const role = this.userRole();
    return role === 'HOSPITAL' || role === 'DOCTOR';
  });

  protected canDeactivate = computed(() => {
    const role = this.userRole();
    return role === 'HOSPITAL' || role === 'DOCTOR';
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
    // Validators.required é aplicado em runtime apenas para HOSPITAL no cadastro (ver syncDoctorValidator).
    doctorId: [''],
    // Validators.required é aplicado em runtime apenas no cadastro (ver syncProcedureValidator).
    procedureId: [''],
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    cpf: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
    birthDate: ['', Validators.required],
    gender: [''],
    bloodType: [''],
    phone: [''],
    email: ['', [Validators.required, Validators.email]],
    address: [''],
    city: [''],
    state: ['', Validators.pattern(/^[A-Z]{2}$/)],
    zipCode: ['', Validators.pattern(/^\d{8}$/)],
    weight: [null as number | null, [Validators.min(1), Validators.max(500)]],
    height: [null as number | null, [Validators.min(0.5), Validators.max(3.0)]],
  });

  ngOnInit(): void {
    this.userRole.set(this.authService.getRole());
    if (this.isHospital()) {
      this.loadDoctors();
    }
    this.loadPatients();
  }

  /** getAll já roteia HOSPITAL para /api/hospital/doctors, devolvendo só os médicos do próprio hospital. */
  private loadDoctors(): void {
    this.loadingDoctors.set(true);

    this.doctorService.getAll(0, 200).subscribe({
      next: (page) => {
        this.doctorOptions.set(
          page.content.map(doctor => ({
            value: doctor.id,
            label: doctor.specialty ? `${doctor.fullName} — ${doctor.specialty}` : doctor.fullName,
          }))
        );
        this.loadingDoctors.set(false);
      },
      error: (error) => {
        this.loadingDoctors.set(false);
        this.notify.error(this.extractErrorMessage(error, 'Erro ao carregar a lista de médicos.'));
      },
    });
  }

  /** O vínculo é definido só no cadastro: na edição o campo não é exigido nem enviado. */
  private syncDoctorValidator(): void {
    const control = this.patientForm.get('doctorId');
    if (!control) return;

    if (this.isHospital() && this.formMode() === 'create') {
      control.setValidators(Validators.required);
    } else {
      control.clearValidators();
    }
    control.updateValueAndValidity({ emitEvent: false });
  }

  /** O procedimento inicial só existe no cadastro: na edição não é exigido nem enviado. */
  private syncProcedureValidator(): void {
    const control = this.patientForm.get('procedureId');
    if (!control) return;

    if (this.formMode() === 'create') {
      control.setValidators(Validators.required);
    } else {
      control.clearValidators();
    }
    control.updateValueAndValidity({ emitEvent: false });
  }

  /** DOCTOR usa os próprios procedimentos; HOSPITAL depende do médico escolhido no form. */
  private loadProcedures(): void {
    if (this.formMode() !== 'create') return;

    if (this.isHospital()) {
      const doctorId = this.patientForm.get('doctorId')?.value;
      if (!doctorId) {
        this.procedureOptions.set([]);
        this.proceduresLoaded.set(false);
        return;
      }
      this.fetchProcedures(this.procedureService.listProceduresByDoctor(doctorId));
      return;
    }

    this.fetchProcedures(this.procedureService.listMyDoctorProcedures());
  }

  private fetchProcedures(source: Observable<Procedure[]>): void {
    this.loadingProcedures.set(true);
    this.proceduresLoaded.set(false);

    source.subscribe({
      next: (procedures) => {
        this.procedureOptions.set(procedures.map(procedure => ({ value: procedure.id, label: procedure.title })));
        this.loadingProcedures.set(false);
        this.proceduresLoaded.set(true);
      },
      error: (error) => {
        this.procedureOptions.set([]);
        this.loadingProcedures.set(false);
        this.proceduresLoaded.set(true);
        this.notify.error(this.extractErrorMessage(error, 'Erro ao carregar a lista de procedimentos.'));
      },
    });
  }

  /** Trocar de médico invalida o procedimento já escolhido: ele pode não pertencer ao novo médico. */
  protected onDoctorChange(doctorId: string): void {
    this.patientForm.get('procedureId')?.reset('');
    this.procedureOptions.set([]);
    this.proceduresLoaded.set(false);
    if (doctorId) this.loadProcedures();
  }

  protected isProcedureFieldDisabled(): boolean {
    if (this.loadingProcedures()) return true;
    return this.isHospital() && !this.patientForm.get('doctorId')?.value;
  }

  protected procedurePlaceholder(): string {
    if (this.loadingProcedures()) return 'Carregando procedimentos...';
    if (this.isHospital() && !this.patientForm.get('doctorId')?.value) return 'Selecione o médico primeiro';
    if (this.proceduresLoaded() && !this.procedureOptions().length) return 'Nenhum procedimento disponível';
    return 'Selecione o procedimento';
  }

  /** O erro de validação tem prioridade sobre a dica de lista vazia. */
  protected procedureHelperText(): string {
    if (this.isFieldInvalid('procedureId')) return 'Selecione um procedimento';
    if (this.proceduresLoaded() && !this.procedureOptions().length) {
      return 'Nenhum procedimento atribuído a este médico. O hospital precisa atribuir um em Procedimentos.';
    }
    return '';
  }

  /** yyyy-MM-dd no fuso local; toISOString() usaria UTC e adiantaria o dia à noite. */
  private todayLocalIsoDate(): string {
    const now = new Date();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  }

  private loadPatients(page = this.pageIndex()): void {
    this.loading.set(true);

    this.patientService.getAll(page, this.pageSize(), 'fullName,asc', this.activeFilter()).subscribe({
      next: (response: PaginatedResponse<PatientListItem>) => {
        this.patients.set(response.content);
        this.pageIndex.set(response.number);
        this.totalPages.set(response.totalPages);
        this.totalElements.set(response.totalElements);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.notify.error(this.extractErrorMessage(error, 'Erro ao carregar pacientes.'));
      },
    });
  }

  private activeFilter(): boolean | null {
    const status = this.statusFilter();
    return status === 'all' ? null : status === 'active';
  }

  protected onSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  protected onStatusChange(status: string): void {
    if (status !== 'all' && status !== 'active' && status !== 'inactive') return;
    this.statusFilter.set(status);
    this.loadPatients(0);
  }

  protected goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages() || page === this.pageIndex()) return;
    this.loadPatients(page);
  }

  protected openCreate(): void {
    this.formMode.set('create');
    this.editingId.set(null);
    this.responsibleDoctorName.set(null);
    this.patientForm.reset();
    this.patientForm.get('cpf')?.enable();
    this.procedureOptions.set([]);
    this.proceduresLoaded.set(false);
    this.syncDoctorValidator();
    this.syncProcedureValidator();
    this.formOpen.set(true);
    // HOSPITAL carrega só após escolher o médico (ver onDoctorChange).
    if (!this.isHospital()) this.loadProcedures();
  }

  protected openEdit(patient: PatientListItem): void {
    this.patientService.getById(patient.id).subscribe({
      next: (full) => {
        this.formMode.set('edit');
        this.editingId.set(full.id);
        this.responsibleDoctorName.set(full.responsibleDoctor?.fullName ?? null);
        this.procedureOptions.set([]);
        this.proceduresLoaded.set(false);
        this.syncDoctorValidator();
        this.syncProcedureValidator();
        this.patientForm.patchValue({
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
        this.notify.error(this.extractErrorMessage(error, 'Erro ao carregar paciente.'));
      },
    });
  }

  protected closeForm(): void {
    this.formOpen.set(false);
    this.responsibleDoctorName.set(null);
    this.patientForm.reset();
    this.patientForm.get('cpf')?.enable();
    this.procedureOptions.set([]);
    this.proceduresLoaded.set(false);
    this.loadingProcedures.set(false);
  }

  /** 400/422 não geram toast automático (ver error.interceptor) — o formulário precisa exibi-los. */
  private extractErrorMessage(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse) {
      const message = err.error?.message;
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }
    return fallback;
  }

  protected onSubmit(): void {
    if (this.patientForm.invalid) {
      this.patientForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const formValue = this.patientForm.getRawValue();

    const isEdit = this.formMode() === 'edit';

    const request: PatientCreateRequest = {
      fullName: formValue.fullName!,
      cpf: formValue.cpf!,
      birthDate: formValue.birthDate!,
      gender: (formValue.gender as Gender) || undefined,
      bloodType: (formValue.bloodType as BloodType) || undefined,
      phone: formValue.phone || undefined,
      email: formValue.email!,
      address: formValue.address || undefined,
      city: formValue.city || undefined,
      state: formValue.state || undefined,
      zipCode: formValue.zipCode || undefined,
      weight: formValue.weight ? Number(formValue.weight) : undefined,
      height: formValue.height ? Number(formValue.height) : undefined,
    };

    // Só o hospital escolhe o médico; o vínculo não muda em atualização.
    if (this.isHospital() && !isEdit) {
      request.doctorId = formValue.doctorId!;
    }

    // O PUT não aceita procedures: o procedimento inicial vai apenas no cadastro.
    if (!isEdit) {
      request.procedures = [
        {
          procedureId: formValue.procedureId!,
          startDate: this.todayLocalIsoDate(),
          status: 'EM_ANDAMENTO',
        },
      ];
    }

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
        this.notify.error(
          this.extractErrorMessage(error, `Erro ao ${isEdit ? 'atualizar' : 'cadastrar'} paciente.`)
        );
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
        this.notify.error(this.extractErrorMessage(error, 'Erro ao carregar paciente.'));
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
        const page = this.statusFilter() === 'active' && this.patients().length === 1 && this.pageIndex() > 0
          ? this.pageIndex() - 1
          : this.pageIndex();
        this.loadPatients(page);
      },
      error: (error) => {
        this.notify.error(this.extractErrorMessage(error, 'Erro ao inativar paciente.'));
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
