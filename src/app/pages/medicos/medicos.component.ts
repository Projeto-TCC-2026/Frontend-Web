import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { forkJoin, Observable, of } from 'rxjs';
import { LucidePlus, LucideSearch, LucidePencil, LucideTrash2, LucideChevronLeft, LucideChevronRight, LucideCopy } from '@lucide/angular';

import { DoctorService, DoctorRegistrationResponse, RegisterDoctorRequest, SaveDoctorRequest } from '../../core/services/doctor.service';
import { HospitalService } from '../../core/services/hospital.service';
import { Doctor } from '../../core/models/entities/doctor.model';
import { Hospital } from '../../core/models/entities/hospital.model';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { DialogService } from '../../core/services/dialog.service';
import { Procedure, ProcedureService } from '../../core/services/procedure.service';

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
    LucideChevronLeft,
    LucideChevronRight,
    LucideCopy,
  ],
  templateUrl: './medicos.component.html',
})
export class MedicosComponent implements OnInit {
  private doctorService = inject(DoctorService);
  private hospitalService = inject(HospitalService);
  private authService = inject(AuthService);
  private notify = inject(NotificationService);
  private dialogService = inject(DialogService);
  private procedureService = inject(ProcedureService);
  private fb = inject(FormBuilder);

  /** ADMIN sees doctors from every hospital (with a hospital picker); HOSPITAL only sees its own. */
  protected isAdmin = computed(() => this.authService.getRole() === 'ADMIN');

  protected doctors = signal<Doctor[]>([]);
  protected hospitals = signal<Hospital[]>([]);
  protected loading = signal(true);
  protected searchTerm = signal('');

  // Paginação vinda do backend — evita carregar todos os médicos da plataforma de uma vez.
  protected pageIndex = signal(0);
  protected pageSize = signal(10);
  protected totalPages = signal(0);
  protected totalElements = signal(0);

  protected formOpen = signal(false);
  protected formMode = signal<FormMode>('create');
  protected formLoading = signal(false);
  protected editingId = signal<string | null>(null);
  protected accessLinkOpen = signal(false);
  protected accessLink = signal('');
  protected accessLinkDoctorName = signal('');
  protected accessLinkCopied = signal(false);
  protected availableProcedures = signal<Procedure[]>([]);
  protected selectedProcedureIds = signal<string[]>([]);
  protected procedurePickerOpen = signal(false);
  protected procedureSearchTerm = signal('');
  protected draftProcedureIds = signal<string[]>([]);
  private assignedProcedureIds = signal<string[]>([]);

  protected filteredProcedures = computed(() => {
    const term = this.procedureSearchTerm().toLowerCase().trim();
    if (!term) return this.availableProcedures();
    return this.availableProcedures().filter(procedure =>
      procedure.title.toLowerCase().includes(term) ||
      (procedure.description ?? '').toLowerCase().includes(term)
    );
  });

  protected filteredDoctors = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.doctors();
    return this.doctors().filter(d =>
      d.fullName.toLowerCase().includes(term) ||
      d.crm.toLowerCase().includes(term) ||
      d.specialty.toLowerCase().includes(term) ||
      (d.hospital?.name ?? '').toLowerCase().includes(term)
    );
  });

  protected form = this.fb.group({
    hospitalId: ['', []],
    // Preenchido apenas ao editar (usuário já existente); no cadastro a conta é criada pelo backend a partir do e-mail.
    userId:     ['', []],
    email:      ['', []],
    fullName:   ['', [Validators.required, Validators.minLength(3)]],
    cpf:        ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
    crm:        ['', [Validators.required]],
    specialty:  ['', [Validators.required]],
    phone:      ['', [Validators.required, Validators.pattern(/^\d{10,11}$/)]],
  });

  ngOnInit(): void {
    if (this.isAdmin()) {
      this.form.get('hospitalId')?.addValidators(Validators.required);
      this.loadHospitals();
    } else {
      this.loadProcedureOptions(this.authService.getCurrentUser()?.hospitalId ?? null);
    }
    this.loadDoctors();
  }

  private loadHospitals(): void {
    this.hospitalService.listAllForSelect().subscribe({
      next: (hospitals) => this.hospitals.set(hospitals),
    });
  }

  private loadDoctors(page = this.pageIndex()): void {
    this.loading.set(true);
    this.doctorService.getAll(page, this.pageSize()).subscribe({
      next: (result) => {
        this.doctors.set(result.content);
        this.pageIndex.set(result.number);
        this.totalPages.set(result.totalPages);
        this.totalElements.set(result.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages() || page === this.pageIndex()) return;
    this.loadDoctors(page);
  }

  protected openCreate(): void {
    this.formMode.set('create');
    this.editingId.set(null);
    this.form.reset();
    this.form.get('cpf')?.enable();
    this.form.get('crm')?.enable();
    this.form.get('email')?.enable();
    this.form.get('email')?.setValidators([Validators.required, Validators.email]);
    this.form.get('email')?.updateValueAndValidity();
    this.selectedProcedureIds.set([]);
    this.assignedProcedureIds.set([]);
    this.loadProcedureOptions(this.form.get('hospitalId')?.value || (this.authService.getCurrentUser()?.hospitalId ?? null));
    this.formOpen.set(true);
  }

  protected openEdit(doctor: Doctor): void {
    this.formMode.set('edit');
    this.editingId.set(doctor.id);
    this.form.patchValue({
      hospitalId: doctor.hospital?.id ?? doctor.hospitalId ?? '',
      userId: doctor.user?.id ?? doctor.userId ?? '',
      email: doctor.user?.email ?? '',
      fullName: doctor.fullName,
      cpf: doctor.cpf,
      crm: doctor.crm,
      specialty: doctor.specialty,
      phone: doctor.phone,
    });
    this.form.get('cpf')?.disable();
    this.form.get('crm')?.disable();
    this.form.get('email')?.clearValidators();
    this.form.get('email')?.disable();
    this.form.get('email')?.updateValueAndValidity();
    const hospitalId = doctor.hospital?.id ?? doctor.hospitalId ?? '';
    this.selectedProcedureIds.set([]);
    this.loadProcedureOptions(hospitalId, doctor.id);
    this.formOpen.set(true);
  }

  protected onHospitalChange(): void {
    const hospitalId = this.form.get('hospitalId')?.value ?? '';
    this.selectedProcedureIds.set([]);
    this.assignedProcedureIds.set([]);
    this.loadProcedureOptions(hospitalId);
  }

  protected openProcedurePicker(): void {
    this.draftProcedureIds.set([...this.selectedProcedureIds()]);
    this.procedureSearchTerm.set('');
    this.procedurePickerOpen.set(true);
  }

  protected closeProcedurePicker(): void {
    this.procedurePickerOpen.set(false);
    this.procedureSearchTerm.set('');
  }

  protected confirmProcedurePicker(): void {
    this.selectedProcedureIds.set([...this.draftProcedureIds()]);
    this.procedurePickerOpen.set(false);
    this.procedureSearchTerm.set('');
  }

  protected isDraftProcedureSelected(procedureId: string): boolean {
    return this.draftProcedureIds().includes(procedureId);
  }

  protected toggleDraftProcedure(procedureId: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.draftProcedureIds.update(ids => checked
      ? [...ids, procedureId]
      : ids.filter(id => id !== procedureId));
  }

  protected onProcedureSearch(event: Event): void {
    this.procedureSearchTerm.set((event.target as HTMLInputElement).value);
  }

  private loadProcedureOptions(hospitalId: string | null, doctorId?: string): void {
    if (!hospitalId) {
      this.availableProcedures.set([]);
      return;
    }

    this.procedureService.list(this.isAdmin() ? hospitalId : null).subscribe({
      next: page => {
        this.availableProcedures.set(page.content);
        if (doctorId) {
          this.procedureService.listDoctorProcedures(doctorId, this.isAdmin()).subscribe({
            next: assignments => {
              const ids = assignments.map(assignment => assignment.procedure.id);
              this.assignedProcedureIds.set(ids);
              this.selectedProcedureIds.set(ids);
            },
          });
        }
      },
      error: () => this.availableProcedures.set([]),
    });
  }

  protected isProcedureSelected(procedureId: string): boolean {
    return this.selectedProcedureIds().includes(procedureId);
  }

  private syncDoctorProcedures(doctorId: string): Observable<unknown[]> {
    const selected = new Set(this.selectedProcedureIds());
    const assigned = new Set(this.assignedProcedureIds());
    const admin = this.isAdmin();
    const operations = [
      ...[...selected].filter(id => !assigned.has(id)).map(id => this.procedureService.assignDoctor(id, doctorId, admin)),
      ...[...assigned].filter(id => !selected.has(id)).map(id => this.procedureService.unassignDoctor(id, doctorId, admin)),
    ];
    return operations.length ? forkJoin(operations) : of([]);
  }

  protected closeForm(): void {
    this.formOpen.set(false);
  }

  protected closeAccessLinkModal(): void {
    this.accessLinkOpen.set(false);
    this.accessLink.set('');
    this.accessLinkDoctorName.set('');
    this.accessLinkCopied.set(false);
  }

  protected async copyAccessLink(): Promise<void> {
    const link = this.accessLink();
    if (!link) return;

    try {
      await navigator.clipboard.writeText(link);
      this.accessLinkCopied.set(true);
      this.notify.success('Link de acesso copiado!');
      setTimeout(() => this.accessLinkCopied.set(false), 1800);
    } catch {
      this.notify.warning('Não foi possível copiar automaticamente. Copie o link manualmente.');
    }
  }

  protected onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.formLoading.set(true);

    const raw = this.form.getRawValue();
    const user = this.authService.getCurrentUser();
    const hospitalId = this.isAdmin() ? raw.hospitalId! : (user?.hospitalId ?? '');

    if (this.formMode() === 'create') {
      const body: RegisterDoctorRequest = {
        email: raw.email!,
        hospitalId,
        fullName: raw.fullName!,
        cpf: raw.cpf!,
        crm: raw.crm!,
        specialty: raw.specialty!,
        phone: raw.phone!,
      };

      this.doctorService.register(body).subscribe({
        next: (created: DoctorRegistrationResponse) => {
          this.syncDoctorProcedures(created.doctor.id).subscribe({
            next: () => {
              const activationLink = created?.activationLink ?? '';
              this.accessLink.set(activationLink);
              this.accessLinkDoctorName.set(created?.doctor?.fullName ?? raw.fullName!);
              this.notify.success('Médico cadastrado! Enviamos um e-mail de boas-vindas para ele definir a senha.');
              this.formLoading.set(false);
              this.formOpen.set(false);
              if (activationLink) this.accessLinkOpen.set(true);
              this.loadDoctors(0);
            },
            error: () => {
              this.formLoading.set(false);
              this.notify.error('Médico cadastrado, mas não foi possível salvar os procedimentos vinculados.');
            },
          });
        },
        error: (err) => {
          this.formLoading.set(false);
          this.notify.error(this.extractErrorMessage(err, 'Não foi possível cadastrar o médico.'));
        },
      });
    } else {
      const body: SaveDoctorRequest = {
        userId: raw.userId!,
        hospitalId,
        fullName: raw.fullName!,
        cpf: raw.cpf!,
        crm: raw.crm!,
        specialty: raw.specialty!,
        phone: raw.phone!,
      };

      this.doctorService.update(this.editingId()!, body).subscribe({
        next: (updated) => {
          this.syncDoctorProcedures(updated.id).subscribe({
            next: () => {
              this.doctors.update(list => list.map(d => d.id === updated.id ? updated : d));
              this.notify.success('Médico atualizado com sucesso!');
              this.formLoading.set(false);
              this.formOpen.set(false);
            },
            error: () => {
              this.formLoading.set(false);
              this.notify.error('Médico atualizado, mas não foi possível salvar os procedimentos vinculados.');
            },
          });
        },
        error: (err) => {
          this.formLoading.set(false);
          this.notify.error(this.extractErrorMessage(err, 'Não foi possível atualizar o médico.'));
        },
      });
    }
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
        this.notify.success('Médico excluído com sucesso!');
        this.loadDoctors(this.doctors().length === 1 && this.pageIndex() > 0 ? this.pageIndex() - 1 : this.pageIndex());
      },
      error: (err) => {
        this.notify.error(this.extractErrorMessage(err, 'Não foi possível excluir o médico.'));
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
