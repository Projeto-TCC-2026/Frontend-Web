import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  LucideDownload,
  LucideInfo,
} from '@lucide/angular';
import { forkJoin, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { AuthService } from '../../core/services/auth.service';
import { DoctorService } from '../../core/services/doctor.service';
import { DoctorProcedureConfigService } from '../../core/services/doctor-procedure-config.service';
import { NotificationService } from '../../core/services/notification.service';
import { PatientService } from '../../core/services/patient.service';
import { ProcedureService } from '../../core/services/procedure.service';
import { CheckinReportPeriod, ReportService } from '../../core/services/report.service';
import { UserRole } from '../../core/models/entities/user.model';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { SelectComponent, SelectOption } from '../../shared/components/select/select.component';

type ReportId = CheckinReportPeriod | 'alerts';
type DateInputType = 'date' | 'week' | 'month';
type FilterName = 'date' | 'week' | 'month' | 'procedureId' | 'patientId' | 'doctorId';

interface FilterDefinition {
  name: FilterName;
  label: string;
  type: 'input' | 'select';
  inputType?: DateInputType;
  required?: boolean;
  hospitalOnly?: boolean;
  helperText?: string;
}

interface ReportDefinition {
  id: ReportId;
  title: string;
  description: string;
  filters: FilterDefinition[];
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonComponent,
    CardComponent,
    InputComponent,
    SelectComponent,
    LucideDownload,
    LucideInfo,
  ],
  templateUrl: './reports.component.html',
})
export class ReportsComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly doctorService = inject(DoctorService);
  private readonly doctorProcedureService = inject(DoctorProcedureConfigService);
  private readonly notify = inject(NotificationService);
  private readonly patientService = inject(PatientService);
  private readonly procedureService = inject(ProcedureService);
  private readonly reportService = inject(ReportService);
  private readonly fb = inject(FormBuilder);

  protected readonly userRole = signal<UserRole | null>(null);
  protected readonly loadingFilters = signal(true);
  protected readonly exportingReport = signal<ReportId | null>(null);
  protected readonly activeReport = signal<ReportId>('daily');
  protected readonly procedureOptions = signal<SelectOption[]>([]);
  protected readonly patientOptions = signal<SelectOption[]>([]);
  protected readonly doctorOptions = signal<SelectOption[]>([]);

  protected readonly reports: ReportDefinition[] = [
    {
      id: 'daily',
      title: 'Relatório diário de check-ins',
      description: 'Dados coletados nos questionários em uma data específica.',
      filters: [
        { name: 'date', label: 'Data', type: 'input', inputType: 'date', required: true },
        { name: 'procedureId', label: 'Procedimento', type: 'select' },
        { name: 'patientId', label: 'Paciente', type: 'select' },
        { name: 'doctorId', label: 'Doutor', type: 'select', hospitalOnly: true },
      ],
    },
    {
      id: 'weekly',
      title: 'Relatório semanal de check-ins',
      description: 'Dados coletados durante uma semana para acompanhar a evolução.',
      filters: [
        { name: 'week', label: 'Semana', type: 'input', inputType: 'week', required: true },
        { name: 'procedureId', label: 'Procedimento', type: 'select' },
        { name: 'patientId', label: 'Paciente', type: 'select' },
        { name: 'doctorId', label: 'Doutor', type: 'select', hospitalOnly: true },
      ],
    },
    {
      id: 'monthly',
      title: 'Relatório mensal de check-ins',
      description: 'Visão mensal dos dados coletados nos questionários de acompanhamento.',
      filters: [
        { name: 'month', label: 'Mês', type: 'input', inputType: 'month', required: true },
        { name: 'procedureId', label: 'Procedimento', type: 'select' },
        { name: 'patientId', label: 'Paciente', type: 'select' },
        { name: 'doctorId', label: 'Doutor', type: 'select', hospitalOnly: true },
      ],
    },
    {
      id: 'alerts',
      title: 'Relatório de alertas clínicos',
      description: 'Alertas emitidos em uma data, com dado clínico, origem e severidade.',
      filters: [
        { name: 'date', label: 'Data', type: 'input', inputType: 'date', required: true },
        { name: 'procedureId', label: 'Procedimento', type: 'select' },
        { name: 'patientId', label: 'Paciente', type: 'select' },
        { name: 'doctorId', label: 'Doutor', type: 'select', hospitalOnly: true },
      ],
    },
  ];

  protected readonly pageSubtitle = computed(() =>
    this.userRole() === 'HOSPITAL'
      ? 'Exporte informações dos seus doutores e pacientes em planilhas compatíveis com Excel.'
      : 'Exporte informações dos seus pacientes em planilhas compatíveis com Excel.'
  );

  protected readonly filters = this.fb.group({
    date: [''],
    week: [''],
    month: [''],
    procedureId: [''],
    patientId: [''],
    doctorId: [''],
  });

  ngOnInit(): void {
    const role = this.auth.getRole();
    this.userRole.set(role);

    const procedures$ = role === 'HOSPITAL'
      ? this.procedureService.list(null).pipe(map(page => page.content))
      : this.doctorProcedureService.listProcedures().pipe(map(assignments => assignments.map(item => item.procedure)));

    const doctors$ = role === 'HOSPITAL'
      ? this.doctorService.getAll(0, 100).pipe(map(page => page.content))
      : of([]);

    forkJoin({
      procedures: procedures$,
      patients: this.patientService.getAll(0, 100).pipe(map(page => page.content)),
      doctors: doctors$,
    }).subscribe({
      next: ({ procedures, patients, doctors }) => {
        this.procedureOptions.set([
          { value: '', label: 'Todos os procedimentos' },
          ...procedures.map(procedure => ({ value: procedure.id, label: procedure.title })),
        ]);
        this.patientOptions.set([
          { value: '', label: 'Todos os pacientes' },
          ...patients.map(patient => ({ value: patient.id, label: patient.fullName })),
        ]);
        this.doctorOptions.set([
          { value: '', label: 'Todos os doutores' },
          ...doctors.map(doctor => ({ value: doctor.id, label: doctor.fullName })),
        ]);
        this.loadingFilters.set(false);
      },
      error: () => {
        this.loadingFilters.set(false);
        this.notify.error('Não foi possível carregar os filtros dos relatórios.');
      },
    });
  }

  protected showFilter(filter: FilterDefinition): boolean {
    return !filter.hospitalOnly || this.userRole() === 'HOSPITAL';
  }

  protected readonly selectedReport = computed(
    () => this.reports.find(report => report.id === this.activeReport()) ?? this.reports[0]
  );

  protected selectReport(reportId: ReportId): void {
    this.activeReport.set(reportId);
  }

  protected optionsFor(filter: FilterDefinition): SelectOption[] {
    if (filter.name === 'procedureId') return this.procedureOptions();
    if (filter.name === 'patientId') return this.patientOptions();
    return this.doctorOptions();
  }

  protected onOptionalFilterChanged(selectedFilter: FilterName, value: string): void {
    if (!value) {
      return;
    }
    (['procedureId', 'patientId', 'doctorId'] as const)
      .filter(filter => filter !== selectedFilter)
      .forEach(filter => this.filters.controls[filter].setValue(''));
  }

  protected export(report: ReportDefinition): void {
    const missingFilter = report.filters.find(filter =>
      filter.required && this.showFilter(filter) && !this.filters.controls[filter.name].value
    );
    if (missingFilter) {
      this.notify.error(`Informe o campo obrigatório: ${missingFilter.label}.`);
      return;
    }

    const formValue = this.filters.getRawValue();
    const params = Object.fromEntries(
      report.filters
        .filter(filter => this.showFilter(filter))
        .map(filter => [filter.name, formValue[filter.name] || null])
    );

    this.exportingReport.set(report.id);
    const request = report.id === 'alerts'
      ? this.reportService.exportAlerts(params)
      : this.reportService.exportCheckins(report.id, params);

    request.subscribe({
      next: file => {
        this.download(file, this.fileName(report.id));
        this.exportingReport.set(null);
        this.notify.success('Relatório exportado com sucesso.');
      },
      error: () => {
        this.exportingReport.set(null);
        this.notify.error('Não foi possível gerar o relatório. Tente novamente.');
      },
    });
  }

  private download(file: Blob, fileName: string): void {
    const url = URL.createObjectURL(file);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private fileName(reportId: ReportId): string {
    return `relatorio-${reportId}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  }
}
