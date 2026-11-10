import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucidePencil, LucidePlus, LucideTrash2, LucideClipboardList } from '@lucide/angular';

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
import { DataTableComponent, TableColumn } from '../../shared/components/data-table/data-table.component';
import { InputSearchFilterComponent } from '../../shared/components/input-search-filter/input-search-filter.component';
import { SelectFilterComponent } from '../../shared/components/select-filter/select-filter.component';

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
    DataTableComponent,
    InputSearchFilterComponent,
    LucidePencil,
    LucidePlus,
    LucideTrash2,
    LucideClipboardList,
    SelectFilterComponent
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
  protected statusFilter = signal<'all' | 'active' | 'inactive'>('active');
  protected statusOptions: SelectOption[] = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Ativos' },
    { value: 'inactive', label: 'Desativados' },
  ];
  protected selectedHospitalId = signal<string | null>(null);
  protected hospitalOptions = computed<SelectOption[]>(() => this.hospitals().map(hospital => ({ value: hospital.id, label: hospital.name })));
  protected pageIndex = signal(0);
  protected pageSize = signal(10);

  protected filteredProcedures = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.procedures();
    return this.procedures().filter(procedure =>
      procedure.title.toLowerCase().includes(term) ||
      (procedure.description ?? '').toLowerCase().includes(term)
    );
  });

  protected tableColumns = computed<TableColumn<Procedure>[]>(() => [
    { key: 'title', label: 'Procedimento', width: 'min-w-[220px]' },
    {
      key: 'description',
      label: 'Descrição',
      width: 'min-w-[260px]',
      format: (value) => value || '-',
    },
    {
      key: 'estimatedDuration',
      label: 'Duração',
      width: 'min-w-[120px]',
      format: (value) => (value ? `${value} min` : '-'),
    },
    { key: 'active', label: 'Status', width: 'w-32' },
  ]);

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
    this.pageIndex.set(0);
    this.loadProcedures(hospitalId);
  }

  protected onStatusChange(status: string): void {
    if (status !== 'all' && status !== 'active' && status !== 'inactive') return;
    this.statusFilter.set(status);
    this.pageIndex.set(0);
    this.loadProcedures(this.selectedHospitalId());
  }

  protected onTablePageChange(event: { page: number; pageSize: number }): void {
    this.pageIndex.set(event.page - 1);
  }

  private loadProcedures(hospitalId: string | null): void {
    this.loading.set(true);
    const status = this.statusFilter();
    const active = status === 'all' ? null : status === 'active';
    this.procedureService.list(this.isAdmin() ? hospitalId : null, active).subscribe({
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
      active: this.editingProcedure()?.active ?? true,
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
        this.loadProcedures(this.selectedHospitalId());
        this.notify.success('Procedimento inativado.');
      },
      error: err => this.notify.error(err?.error?.message ?? 'Não foi possível inativar o procedimento.'),
    });
  }

  protected onSearch(value: string): void {
    this.searchTerm.set(value);
    this.pageIndex.set(0);
  }

  protected isFieldInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control?.invalid && control.touched);
  }
}
