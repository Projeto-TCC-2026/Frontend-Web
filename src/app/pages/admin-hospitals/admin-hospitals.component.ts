import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import {
  LucidePlus,
  LucideSearch,
  LucidePencil,
  LucideTrash2,
  LucideChevronLeft,
  LucideChevronRight,
  LucideToggleLeft,
  LucideToggleRight,
} from '@lucide/angular';

import { HospitalService, HospitalRequest } from '../../core/services/hospital.service';
import { Hospital } from '../../core/models/entities/hospital.model';
import { NotificationService } from '../../core/services/notification.service';
import { DialogService } from '../../core/services/dialog.service';

import { ButtonComponent } from '../../shared/components/button/button.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { DialogComponent } from '../../shared/components/dialog/dialog.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

type FormMode = 'create' | 'edit';

@Component({
  selector: 'app-admin-hospitals',
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
    LucideToggleLeft,
    LucideToggleRight,
  ],
  templateUrl: './admin-hospitals.component.html',
})
export class AdminHospitalsComponent implements OnInit {
  private hospitalService = inject(HospitalService);
  private notify = inject(NotificationService);
  private dialogService = inject(DialogService);
  private fb = inject(FormBuilder);

  protected hospitals = signal<Hospital[]>([]);
  protected loading = signal(true);
  protected searchTerm = signal('');

  // Paginação server-side
  protected pageIndex = signal(0);
  protected pageSize = signal(10);
  protected totalPages = signal(0);
  protected totalElements = signal(0);

  // Modal
  protected formOpen = signal(false);
  protected formMode = signal<FormMode>('create');
  protected formLoading = signal(false);
  protected editingId = signal<string | null>(null);

  protected filteredHospitals = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.hospitals();
    return this.hospitals().filter(
      h =>
        h.name.toLowerCase().includes(term) ||
        h.cnpj.includes(term) ||
        (h.city ?? '').toLowerCase().includes(term) ||
        (h.state ?? '').toLowerCase().includes(term) ||
        (h.email ?? '').toLowerCase().includes(term),
    );
  });

  protected form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    cnpj: ['', [Validators.required, Validators.pattern(/^\d{14}$/)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required]],
    address: ['', [Validators.required]],
    city: ['', [Validators.required]],
    state: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(2)]],
  });

  ngOnInit(): void {
    this.loadHospitals();
  }

  private loadHospitals(page = this.pageIndex()): void {
    this.loading.set(true);
    this.hospitalService.getAll(page, this.pageSize()).subscribe({
      next: result => {
        this.hospitals.set(result.content);
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
    this.loadHospitals(page);
  }

  protected openCreate(): void {
    this.formMode.set('create');
    this.editingId.set(null);
    this.form.reset();
    this.form.get('cnpj')?.enable();
    this.formOpen.set(true);
  }

  protected openEdit(hospital: Hospital): void {
    this.formMode.set('edit');
    this.editingId.set(hospital.id);
    this.form.patchValue({
      name: hospital.name,
      cnpj: hospital.cnpj,
      email: hospital.email,
      phone: hospital.phone,
      address: hospital.address,
      city: hospital.city,
      state: hospital.state,
    });
    // No modo edição o CNPJ não pode ser alterado
    this.form.get('cnpj')?.disable();
    this.formOpen.set(true);
  }

  protected closeForm(): void {
    this.formOpen.set(false);
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.formLoading.set(true);
    const raw = this.form.getRawValue();

    const body: HospitalRequest = {
      name: raw.name!,
      cnpj: raw.cnpj!,
      email: raw.email!,
      phone: raw.phone!,
      address: raw.address!,
      city: raw.city!,
      state: raw.state!.toUpperCase(),
    };

    if (this.formMode() === 'create') {
      this.hospitalService.create(body).subscribe({
        next: () => {
          this.notify.success('Hospital cadastrado com sucesso!');
          this.formLoading.set(false);
          this.formOpen.set(false);
          this.loadHospitals(0);
        },
        error: err => {
          this.formLoading.set(false);
          this.notify.error(this.extractErrorMessage(err, 'Não foi possível cadastrar o hospital.'));
        },
      });
    } else {
      this.hospitalService.update(this.editingId()!, body).subscribe({
        next: updated => {
          this.hospitals.update(list =>
            list.map(h => (h.id === updated.id ? updated : h)),
          );
          this.notify.success('Hospital atualizado com sucesso!');
          this.formLoading.set(false);
          this.formOpen.set(false);
        },
        error: err => {
          this.formLoading.set(false);
          this.notify.error(this.extractErrorMessage(err, 'Não foi possível atualizar o hospital.'));
        },
      });
    }
  }

  protected async onToggleActive(hospital: Hospital): Promise<void> {
    const isActive = hospital.active ?? false;
    const action = isActive ? 'inativar' : 'ativar';
    const actionLabel = isActive ? 'Inativar' : 'Ativar';

    const confirmed = await this.dialogService.confirm({
      title: `${actionLabel} hospital?`,
      message: `Deseja ${action} o hospital ${hospital.name}?`,
      confirmLabel: actionLabel,
      cancelLabel: 'Cancelar',
      variant: isActive ? 'destructive' : 'default',
    });

    if (!confirmed) return;

    const request$ = isActive
      ? this.hospitalService.disable(hospital.id)
      : this.hospitalService.enable(hospital.id);

    request$.subscribe({
      next: () => {
        this.notify.success(`Hospital ${isActive ? 'inativado' : 'ativado'} com sucesso!`);
        this.loadHospitals(this.pageIndex());
      },
      error: err => {
        this.notify.error(this.extractErrorMessage(err, `Não foi possível ${action} o hospital.`));
      },
    });
  }

  protected async onDelete(hospital: Hospital): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title: 'Excluir hospital?',
      message: `Deseja excluir ${hospital.name}? Esta ação não pode ser desfeita.`,
      confirmLabel: 'Excluir',
      cancelLabel: 'Cancelar',
      variant: 'destructive',
    });

    if (!confirmed) return;

    this.hospitalService.deleteHospital(hospital.id).subscribe({
      next: () => {
        this.notify.success('Hospital excluído com sucesso!');
        this.loadHospitals(
          this.hospitals().length === 1 && this.pageIndex() > 0
            ? this.pageIndex() - 1
            : this.pageIndex(),
        );
      },
      error: err => {
        this.notify.error(this.extractErrorMessage(err, 'Não foi possível excluir o hospital.'));
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

  /** Formata CNPJ digitado no input (somente exibição). O valor enviado ao backend é sem formatação. */
  protected formatCnpjDisplay(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    return digits
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }

  /** Extrai dígitos do CNPJ (sem máscara) e atualiza o controle do formulário. */
  protected onCnpjInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 14);
    const formatted = this.formatCnpjDisplay(digits);
    input.value = formatted;
    this.form.get('cnpj')?.setValue(digits, { emitEvent: false });
  }

  /** Exibe CNPJ formatado no campo ao abrir edição. */
  protected getCnpjDisplayValue(): string {
    const raw = this.form.get('cnpj')?.value ?? '';
    return this.formatCnpjDisplay(raw);
  }

  private extractErrorMessage(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse) {
      const message = err.error?.message;
      if (typeof message === 'string' && message.trim()) return message;
    }
    return fallback;
  }
}
