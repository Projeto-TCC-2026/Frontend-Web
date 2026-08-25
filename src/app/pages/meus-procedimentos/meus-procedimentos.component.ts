import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideChevronRight, LucideGripVertical, LucidePencil, LucidePlus, LucideSave, LucideTrash2 } from '@lucide/angular';

import {
  DoctorProcedureAssignment,
  DoctorProcedureConfigService,
  DoctorProcedureField,
  FieldDataType,
  FieldTypePreset,
} from '../../core/services/doctor-procedure-config.service';
import { NotificationService } from '../../core/services/notification.service';
import { DialogService } from '../../core/services/dialog.service';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { DialogComponent } from '../../shared/components/dialog/dialog.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { SelectComponent, SelectOption } from '../../shared/components/select/select.component';

@Component({
  selector: 'app-meus-procedimentos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DragDropModule,
    ButtonComponent,
    DialogComponent,
    EmptyStateComponent,
    LoadingComponent,
    SelectComponent,
    LucideChevronRight,
    LucideGripVertical,
    LucidePencil,
    LucidePlus,
    LucideSave,
    LucideTrash2,
  ],
  templateUrl: './meus-procedimentos.component.html',
})
export class MeusProcedimentosComponent implements OnInit {
  private configService = inject(DoctorProcedureConfigService);
  private notify = inject(NotificationService);
  private dialogService = inject(DialogService);
  private fb = inject(FormBuilder);

  protected assignments = signal<DoctorProcedureAssignment[]>([]);
  protected presets = signal<FieldTypePreset[]>([]);
  protected fields = signal<DoctorProcedureField[]>([]);
  protected selectedAssignment = signal<DoctorProcedureAssignment | null>(null);
  protected loading = signal(true);
  protected fieldsLoading = signal(false);
  protected saving = signal(false);
  protected fieldModalOpen = signal(false);
  protected editingIndex = signal<number | null>(null);
  protected dataTypeOptions: SelectOption[] = [
    { value: 'INTEGER', label: 'Número inteiro' }, { value: 'DECIMAL', label: 'Número decimal' },
    { value: 'BOOLEAN', label: 'Sim ou não' }, { value: 'TEXT', label: 'Texto livre' },
    { value: 'SCALE', label: 'Escala' }, { value: 'PHOTO', label: 'Foto' },
  ];
  protected booleanOptions: SelectOption[] = [{ value: 'true', label: 'Sim' }, { value: 'false', label: 'Não' }];
  protected configurationDirty = signal(false);
  private savedFieldsSnapshot = '';

  protected fieldForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    description: ['', [Validators.maxLength(2000)]],
    unit: ['', [Validators.maxLength(40)]],
    dataType: ['TEXT' as FieldDataType, [Validators.required]],
    metricKey: ['', [Validators.maxLength(60)]],
    required: [false],
    minValue: [null as number | null],
    maxValue: [null as number | null],
    normalBoolean: [null as boolean | null],
  });

  protected selectedTitle = computed(() => this.selectedAssignment()?.procedure.title ?? '');

  ngOnInit(): void {
    this.configService.listPresets().subscribe({
      next: presets => this.presets.set(presets),
      error: () => this.notify.error('Não foi possível carregar os tipos de campo.'),
    });
    this.configService.listProcedures().subscribe({
      next: assignments => {
        this.assignments.set(assignments);
        this.loading.set(false);
        if (assignments.length) this.selectAssignment(assignments[0]);
      },
      error: () => {
        this.loading.set(false);
        this.notify.error('Não foi possível carregar seus procedimentos.');
      },
    });
  }

  protected async selectAssignment(assignment: DoctorProcedureAssignment): Promise<void> {
    if (this.selectedAssignment()?.id === assignment.id) return;
    if (this.configurationDirty()) {
      const shouldSave = await this.confirmPendingChanges();
      if (shouldSave === null) return;
      if (shouldSave && !(await this.persistConfiguration())) return;
    }
    this.selectedAssignment.set(assignment);
    this.fieldsLoading.set(true);
    this.configService.listFields(assignment.id).subscribe({
      next: fields => {
        this.fields.set(fields);
        this.setSavedSnapshot();
        this.fieldsLoading.set(false);
      },
      error: () => {
        this.fieldsLoading.set(false);
        this.notify.error('Não foi possível carregar a configuração deste procedimento.');
      },
    });
  }

  protected openNewField(): void {
    this.editingIndex.set(null);
    this.fieldForm.reset({
      name: '', description: '', unit: '', dataType: 'TEXT', metricKey: '', required: false, minValue: null, maxValue: null, normalBoolean: null,
    });
    this.fieldModalOpen.set(true);
  }

  protected openEditField(index: number): void {
    const field = this.fields()[index];
    this.editingIndex.set(index);
    this.fieldForm.patchValue({
      name: field.name,
      description: field.description,
      unit: field.unit,
      dataType: field.dataType,
      metricKey: field.metricKey,
      required: field.required,
      minValue: field.minValue,
      maxValue: field.maxValue,
      normalBoolean: field.normalBoolean,
    });
    this.fieldModalOpen.set(true);
  }

  protected closeFieldModal(): void {
    this.fieldModalOpen.set(false);
  }

  protected applyPreset(preset: FieldTypePreset): void {
    this.fieldForm.patchValue({
      dataType: preset.dataType,
      minValue: preset.minValue,
      maxValue: preset.maxValue,
      normalBoolean: null,
    });
  }

  protected saveField(): void {
    if (this.fieldForm.invalid) {
      this.fieldForm.markAllAsTouched();
      return;
    }
    const value = this.fieldForm.getRawValue();
    const dataType = value.dataType as FieldDataType;
    const supportsNumericRange = dataType === 'INTEGER' || dataType === 'DECIMAL' || dataType === 'SCALE';
    const supportsUnit = dataType === 'INTEGER' || dataType === 'DECIMAL';
    const field: DoctorProcedureField = {
      id: this.editingIndex() === null ? undefined : this.fields()[this.editingIndex()!].id,
      name: value.name!.trim(),
      description: value.description?.trim() ?? '',
      unit: supportsUnit ? (value.unit?.trim() ?? '') : '',
      dataType,
      metricKey: value.metricKey?.trim() ?? '',
      required: Boolean(value.required),
      displayOrder: this.editingIndex() ?? this.fields().length,
      minValue: supportsNumericRange ? value.minValue : null,
      maxValue: supportsNumericRange ? value.maxValue : null,
      normalBoolean: value.dataType === 'BOOLEAN'
        ? (value.normalBoolean === true || String(value.normalBoolean) === 'true')
        : null,
      thresholds: this.editingIndex() === null ? [] : this.fields()[this.editingIndex()!].thresholds ?? [],
    };
    this.fields.update(current => {
      const index = this.editingIndex();
      if (index === null) return [...current, field];
      return current.map((item, itemIndex) => itemIndex === index ? field : item);
    });
    this.configurationDirty.set(true);
    this.fieldModalOpen.set(false);
  }

  protected removeField(index: number): void {
    this.fields.update(current => current.filter((_, itemIndex) => itemIndex !== index)
      .map((field, itemIndex) => ({ ...field, displayOrder: itemIndex })));
    this.configurationDirty.set(true);
  }

  protected dropField(event: CdkDragDrop<DoctorProcedureField[]>): void {
    const reordered = [...this.fields()];
    moveItemInArray(reordered, event.previousIndex, event.currentIndex);
    this.fields.set(reordered.map((field, index) => ({ ...field, displayOrder: index })));
    this.configurationDirty.set(true);
  }

  protected saveConfiguration(): void {
    void this.persistConfiguration();
  }

  private persistConfiguration(): Promise<boolean> {
    const assignment = this.selectedAssignment();
    if (!assignment) return Promise.resolve(false);
    this.saving.set(true);
    const fields = this.fields().map((field, index) => ({ ...field, displayOrder: index }));
    return new Promise(resolve => this.configService.saveFields(assignment.id, fields).subscribe({
      next: saved => {
        this.fields.set(saved);
        this.setSavedSnapshot();
        this.saving.set(false);
        this.notify.success('Formulário do procedimento salvo.');
        resolve(true);
      },
      error: err => {
        this.saving.set(false);
        this.notify.error(err?.error?.message ?? 'Não foi possível salvar o formulário.');
        resolve(false);
      },
    }));
  }

  private setSavedSnapshot(): void {
    this.savedFieldsSnapshot = JSON.stringify(this.fields());
    this.configurationDirty.set(false);
  }

  private async confirmPendingChanges(): Promise<boolean | null> {
    const save = await this.dialogService.confirm({
      title: 'Alterações não salvas',
      message: 'Você tem alterações neste procedimento. Deseja salvar antes de trocar?',
      confirmLabel: 'Salvar',
      cancelLabel: 'Descartar',
      variant: 'default',
    });
    return save;
  }

  protected dataTypeLabel(dataType: FieldDataType): string {
    const labels: Record<FieldDataType, string> = {
      INTEGER: 'Número inteiro', DECIMAL: 'Número decimal', BOOLEAN: 'Sim ou não', TEXT: 'Texto livre', SCALE: 'Escala', PHOTO: 'Foto',
    };
    return labels[dataType];
  }

  protected isFieldInvalid(name: string): boolean {
    const control = this.fieldForm.get(name);
    return !!(control?.invalid && control.touched);
  }
}
