import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { 
  LucidePlus, 
  LucidePencil, 
  LucideTrash2, 
  LucideCheck, 
  LucideX,
  LucideBuilding2,
  LucideEye
} from '@lucide/angular';

import { HospitalService, CreateHospitalRequest } from '../../core/services/hospital.service';
import { NotificationService } from '../../core/services/notification.service';
import { Hospital } from '../../core/models/entities/hospital.model';

import { ButtonComponent } from '../../shared/components/button/button.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';

@Component({
  selector: 'app-admin-hospitals',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonComponent,
    LoadingComponent,
    LucidePlus,
    LucidePencil,
    LucideTrash2,
    LucideCheck,
    LucideX,
    LucideBuilding2,
    LucideEye,
  ],
  templateUrl: './admin-hospitals.component.html',
})
export class AdminHospitalsComponent implements OnInit {
  private hospitalService = inject(HospitalService);
  private notify = inject(NotificationService);
  private fb = inject(FormBuilder);

  protected hospitals = signal<Hospital[]>([]);
  protected loading = signal(true);
  protected saving = signal(false);
  protected showCreateModal = signal(false);
  protected selectedHospital = signal<Hospital | null>(null);
  protected showViewModal = signal(false);

  // Filtros e busca
  protected searchTerm = signal('');
  protected filteredHospitals = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.hospitals();
    
    return this.hospitals().filter(hospital =>
      hospital.name.toLowerCase().includes(term) ||
      hospital.email.toLowerCase().includes(term) ||
      hospital.city.toLowerCase().includes(term) ||
      hospital.state.toLowerCase().includes(term) ||
      hospital.cnpj.includes(term)
    );
  });

  protected createForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    cnpj: ['', [Validators.required, Validators.pattern(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required]],
    address: ['', [Validators.required]],
    city: ['', [Validators.required]],
    state: ['', [Validators.required]],
  });

  ngOnInit(): void {
    this.loadHospitals();
  }

  private loadHospitals(): void {
    this.loading.set(true);
    this.hospitalService.getAll().subscribe({
      next: (hospitals) => {
        this.hospitals.set(hospitals);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.notify.error('Erro ao carregar hospitais: ' + (error.message || 'Erro desconhecido'));
      },
    });
  }

  protected openCreateModal(): void {
    this.createForm.reset();
    this.showCreateModal.set(true);
  }

  protected closeCreateModal(): void {
    this.showCreateModal.set(false);
    this.createForm.reset();
  }

  protected onCreateSubmit(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const formValue = this.createForm.getRawValue();

    const request: CreateHospitalRequest = {
      name: formValue.name!,
      cnpj: formValue.cnpj!,
      email: formValue.email!,
      phone: formValue.phone!,
      address: formValue.address!,
      city: formValue.city!,
      state: formValue.state!,
    };

    this.hospitalService.create(request).subscribe({
      next: (newHospital) => {
        this.hospitals.update(current => [...current, newHospital]);
        this.saving.set(false);
        this.closeCreateModal();
        this.notify.success('Hospital cadastrado com sucesso!');
      },
      error: (error) => {
        this.saving.set(false);
        this.notify.error('Erro ao cadastrar hospital: ' + (error.message || 'Erro desconhecido'));
      },
    });
  }

  protected viewHospital(hospital: Hospital): void {
    this.selectedHospital.set(hospital);
    this.showViewModal.set(true);
  }

  protected closeViewModal(): void {
    this.showViewModal.set(false);
    this.selectedHospital.set(null);
  }

  protected activateHospital(hospital: Hospital): void {
    this.hospitalService.activate(hospital.id).subscribe({
      next: () => {
        this.notify.success(`Hospital ${hospital.name} ativado com sucesso!`);
        this.loadHospitals(); // Recarregar para atualizar status
      },
      error: (error) => {
        this.notify.error('Erro ao ativar hospital: ' + (error.message || 'Erro desconhecido'));
      },
    });
  }

  protected deactivateHospital(hospital: Hospital): void {
    if (confirm(`Tem certeza que deseja inativar o hospital "${hospital.name}"?`)) {
      this.hospitalService.deactivate(hospital.id).subscribe({
        next: () => {
          this.notify.success(`Hospital ${hospital.name} inativado com sucesso!`);
          this.loadHospitals(); // Recarregar para atualizar status
        },
        error: (error) => {
          this.notify.error('Erro ao inativar hospital: ' + (error.message || 'Erro desconhecido'));
        },
      });
    }
  }

  protected deleteHospital(hospital: Hospital): void {
    if (confirm(`Tem certeza que deseja excluir permanentemente o hospital "${hospital.name}"? Esta ação não pode ser desfeita.`)) {
      this.hospitalService.deleteHospital(hospital.id).subscribe({
        next: () => {
          this.hospitals.update(current => current.filter(h => h.id !== hospital.id));
          this.notify.success(`Hospital ${hospital.name} excluído com sucesso!`);
        },
        error: (error) => {
          this.notify.error('Erro ao excluir hospital: ' + (error.message || 'Erro desconhecido'));
        },
      });
    }
  }

  protected isFieldInvalid(field: string): boolean {
    const ctrl = this.createForm.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  protected formatCNPJ(value: string): string {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  }

  protected onCnpjInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = this.formatCNPJ(input.value);
  }

  protected onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }
}