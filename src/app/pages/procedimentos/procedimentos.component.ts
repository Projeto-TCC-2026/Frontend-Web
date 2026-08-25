import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucidePencil, LucidePlus, LucideTrash2 } from '@lucide/angular';

import { Procedure, ProcedureRequest, ProcedureService } from '../../core/services/procedure.service';
import { HospitalService } from '../../core/services/hospital.service';
import { Hospital } from '../../core/models/entities/hospital.model';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { DialogService } from '../../core/services/dialog.service';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { DialogComponent } from '../../shared/components/dialog/dialog.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { SelectComponent, SelectOption } from '../../shared/components/select/select.component';

@Component({
  selector: 'app-procedimentos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonComponent,
    DialogComponent,
    EmptyStateComponent,
    LoadingComponent,
    SelectComponent,
    LucidePencil,
    LucidePlus,
    LucideTrash2,
  ],
  templateUrl: './procedimentos.component.html',
})
export class ProcedimentosComponent implements OnInit {
  private procedureService = inject(ProcedureService);
  private hospitalService = inject(HospitalService);
  private authService = inject(AuthService);
  private notify = inject(NotificationService);
  private dialogService = inject(DialogService);
  private fb = inject(FormBuilder);

  protected isAdmin = computed(() => this.authService.getRole() === 'ADMIN');
  protected hospitals = signal<Hospital[]>([]);
  protected procedures = signal<Procedure[]>([]);
  protected loading = signal(true);
  protected saving = signal(false);
  protected formOpen = signal(false);
  protected formMode = signal<'create' | 'edit'>('create');
  protected editingProcedure = signal<Procedure | null>(null);
  protected searchTerm = signal('');
  protected selectedHospitalId = signal<string | null>(null);
  protected hospitalOptions = computed<SelectOption[]>(() => this.hospitals().map(hospital => ({ value: hospital.id, label: hospital.name })));

  protected filteredProcedures = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.procedures();
    return this.procedures().filter(procedure =>
      procedure.title.toLowerCase().includes(term) ||
      (procedure.description ?? '').toLowerCase().includes(term)
    );
  });

  protected form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(255)]],
    description: ['', [Validators.maxLength(2000)]],
    estimatedDuration: [null as number | null, [Validators.min(1)]],
  });

  ngOnInit(): void {
    if (this.isAdmin()) {
      this.hospitalService.listAllForSelect().subscribe({
        next: hospitals => {
          this.hospitals.set(hospitals);
          if (hospitals.length) this.selectHospital(hospitals[0].id);
          else this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
      return;
    }

    const hospitalId = this.authService.getCurrentUser()?.hospitalId ?? null;
    this.selectedHospitalId.set(hospitalId);
    this.loadProcedures(hospitalId);
  }

  protected selectHospital(hospitalId: string): void {
    this.selectedHospitalId.set(hospitalId);
    this.loadProcedures(hospitalId);
  }

  private loadProcedures(hospitalId: string | null): void {
    this.loading.set(true);
    this.procedureService.list(this.isAdmin() ? hospitalId : null).subscribe({
      next: page => {
        this.procedures.set(page.content);
        this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        this.notify.error(err?.error?.message ?? 'Não foi possível carregar os procedimentos.');
      },
    });
  }

  protected openCreate(): void {
    this.formMode.set('create');
    this.editingProcedure.set(null);
    this.form.reset({ title: '', description: '', estimatedDuration: null });
    this.formOpen.set(true);
  }

  protected openEdit(procedure: Procedure): void {
    this.formMode.set('edit');
    this.editingProcedure.set(procedure);
    this.form.patchValue({
      title: procedure.title,
      description: procedure.description ?? '',
      estimatedDuration: procedure.estimatedDuration ?? null,
    });
    this.formOpen.set(true);
  }

  protected closeForm(): void {
    this.formOpen.set(false);
    this.form.reset();
  }

  protected onSubmit(): void {
    if (this.form.invalid || !this.selectedHospitalId()) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const request: ProcedureRequest = {
      title: value.title!.trim(),
      description: value.description?.trim() ?? '',
      estimatedDuration: value.estimatedDuration,
      active: true,
    };
    const hospitalId = this.isAdmin() ? this.selectedHospitalId() : null;
    const editingId = this.editingProcedure()?.id;

    this.saving.set(true);
    const operation = editingId
      ? this.procedureService.update(hospitalId, editingId, request)
      : this.procedureService.create(hospitalId, request);

    operation.subscribe({
      next: saved => {
        this.procedures.update(current => editingId
          ? current.map(procedure => procedure.id === saved.id ? saved : procedure)
          : [...current, saved]);
        this.saving.set(false);
        this.closeForm();
        this.notify.success(editingId ? 'Procedimento atualizado!' : 'Procedimento cadastrado!');
      },
      error: err => {
        this.saving.set(false);
        this.notify.error(err?.error?.message ?? 'Não foi possível salvar o procedimento.');
      },
    });
  }

  protected async deactivate(procedure: Procedure): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title: 'Inativar procedimento?',
      message: `O procedimento "${procedure.title}" será ocultado do catálogo ativo, sem apagar seu histórico.`,
      confirmLabel: 'Inativar',
      cancelLabel: 'Cancelar',
      variant: 'destructive',
    });
    if (!confirmed) return;

    const hospitalId = this.isAdmin() ? this.selectedHospitalId() : null;
    this.procedureService.deactivate(hospitalId, procedure.id).subscribe({
      next: () => {
        this.procedures.update(current => current.filter(item => item.id !== procedure.id));
        this.notify.success('Procedimento inativado.');
      },
      error: err => this.notify.error(err?.error?.message ?? 'Não foi possível inativar o procedimento.'),
    });
  }

  protected onSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  protected isFieldInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control?.invalid && control.touched);
  }
}
