import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  ChartData,
  ChartOptions,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import {
  LucideBell,
  LucideChevronLeft,
  LucideChevronRight,
  LucideClipboardList,
  LucideHeartPulse,
  LucideUserRound,
  LucideUsers,
  LucideLayoutDashboard
} from '@lucide/angular';
import { AuthService } from '../../core/services/auth.service';
import {
  DashboardService,
  DailyMetric,
  DashboardSummary,
  DoctorDashboard,
  HospitalDashboard,
  ProcedureFieldMetrics,
  ProcedureMetrics,
} from '../../core/services/dashboard.service';
import { HospitalService } from '../../core/services/hospital.service';
import { Procedure, ProcedureService } from '../../core/services/procedure.service';
import { Hospital } from '../../core/models/entities/hospital.model';
import { UserRole } from '../../core/models/entities/user.model';
import { WeekFilterComponent } from '../../shared/components/week-filter/week-filter.component';
import { isoWeekBounds, isoWeekString } from './dashboard-date.utils';
import { SelectFilterComponent, SelectOption } from '../../shared/components/select-filter/select-filter.component';

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
);

const WEEKDAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    BaseChartDirective,
    LucideBell,
    LucideChevronLeft,
    LucideChevronRight,
    LucideClipboardList,
    LucideHeartPulse,
    LucideUserRound,
    LucideUsers,
    LucideLayoutDashboard,
    WeekFilterComponent,
    SelectFilterComponent
],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly dashboardService = inject(DashboardService);
  private readonly hospitalService = inject(HospitalService);
  private readonly procedureService = inject(ProcedureService);

  protected readonly role = signal<UserRole | null>(null);
  protected readonly summary = signal<DashboardSummary | null>(null);
  protected readonly hospitalDashboard = signal<HospitalDashboard | null>(null);
  protected readonly doctorDashboard = signal<DoctorDashboard | null>(null);
  protected readonly loading = signal(false);

  protected readonly analyticsWeek = signal(isoWeekString(new Date()));
  protected readonly analyticsStartDate = computed(
    () => isoWeekBounds(this.analyticsWeek())?.start ?? '',
  );
  protected readonly analyticsEndDate = computed(
    () => isoWeekBounds(this.analyticsWeek())?.end ?? '',
  );
  protected readonly dailyCheckins = signal<DailyMetric[] | null>(null);
  protected readonly dailySmartwatchPatients = signal<DailyMetric[] | null>(null);
  protected readonly dailyAlerts = signal<DailyMetric[] | null>(null);
  protected readonly checkinsLoading = signal(false);
  protected readonly smartwatchLoading = signal(false);
  protected readonly alertsLoading = signal(false);
  protected readonly checkinsError = signal(false);
  protected readonly smartwatchError = signal(false);
  protected readonly alertsError = signal(false);

  protected readonly hospitals = signal<Hospital[]>([]);
  protected readonly hospitalOptions = computed<SelectOption[]>(() =>
    this.hospitals().map(hospital => ({ value: hospital.id, label: hospital.name })),
  );
  protected readonly selectedHospitalId = signal('');
  protected readonly procedures = signal<Procedure[]>([]);
  protected readonly procedureOptions = computed<SelectOption[]>(() =>
    this.procedures().map(procedure => ({ value: procedure.id, label: procedure.title })),
  );
  protected readonly selectedProcedureId = signal('');
  protected readonly proceduresLoading = signal(false);
  protected readonly proceduresError = signal(false);
  protected readonly procedureMetrics = signal<ProcedureMetrics | null>(null);
  protected readonly procedureMetricsLoading = signal(false);
  protected readonly procedureMetricsError = signal(false);
  private analyticsRequestId = 0;
  private procedureMetricsRequestId = 0;

  protected readonly isSevenDayRange = computed(() => isoWeekBounds(this.analyticsWeek()) !== null);

  protected readonly procedureFields = computed(() => this.procedureMetrics()?.fields ?? []);

  protected readonly monthlyProcedureChartData = computed<ChartData<'bar'>>(() => {
    const procedures = this.hospitalDashboard()?.proceduresByPeriod ?? [];
    return {
      labels: procedures.map(item => item.period),
      datasets: [{
        data: procedures.map(item => item.totalProcedures),
        label: 'Procedimentos',
        backgroundColor: '#0C4C8A',
        borderRadius: 6,
        maxBarThickness: 42,
      }],
    };
  });

  protected readonly monthlyProcedureChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: context => ` ${context.parsed.y} procedimentos`,
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#7C8DA1' } },
      y: {
        beginAtZero: true,
        ticks: { precision: 0, color: '#7C8DA1' },
        grid: { color: '#E4E9ED' },
      },
    },
  };

  protected readonly dailyLineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: context => ` ${context.parsed.y} ${context.dataset.label?.toLowerCase() ?? ''}`,
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#7C8DA1', maxRotation: 0 } },
      y: {
        beginAtZero: true,
        ticks: { precision: 0, color: '#7C8DA1' },
        grid: { color: '#E4E9ED' },
      },
    },
  };

  protected readonly checkinsChartData = computed(() =>
    this.dailyMetricChartData(this.dailyCheckins(), 'envios', '#0C4C8A'));

  protected readonly smartwatchChartData = computed(() =>
    this.dailyMetricChartData(this.dailySmartwatchPatients(), 'pacientes', '#2E77B8'));

  protected readonly alertsChartData = computed(() =>
    this.dailyMetricChartData(this.dailyAlerts(), 'alertas', '#D9484B'));

  protected readonly patientPage = signal(0);
  protected readonly patientsPerPage = 5;

  protected get paginatedPatients() {
    const all = this.hospitalDashboard()?.latestPatients ?? [];
    const start = this.patientPage() * this.patientsPerPage;
    return all.slice(start, start + this.patientsPerPage);
  }

  protected get totalPatientPages() {
    const all = this.hospitalDashboard()?.latestPatients ?? [];
    return Math.ceil(all.length / this.patientsPerPage);
  }

  ngOnInit(): void {
    const role = this.auth.getRole();
    this.role.set(role);
    this.loadAnalytics();
    this.loadProcedures();

    if (role === 'HOSPITAL') {
      this.loadHospitalDashboard();
    } else if (role === 'ADMIN') {
      this.loadAdminSummary();
    } else if (role === 'DOCTOR') {
      this.loadDoctorDashboard();
    }
  }

  protected onAnalyticsWeekChange(week: string): void {
    this.analyticsWeek.set(week);
    const startDate = this.analyticsStartDate();
    const endDate = this.analyticsEndDate();
    if (!startDate || !endDate) {
      this.analyticsRequestId++;
      this.dailyCheckins.set(null);
      this.dailySmartwatchPatients.set(null);
      this.dailyAlerts.set(null);
      this.checkinsError.set(false);
      this.smartwatchError.set(false);
      this.alertsError.set(false);
      this.checkinsLoading.set(false);
      this.smartwatchLoading.set(false);
      this.alertsLoading.set(false);
      this.loadProcedureMetrics();
      return;
    }

    this.loadAnalytics();
    this.loadProcedureMetrics();
  }

  protected onHospitalChange(hospitalId: string): void {
    this.selectedHospitalId.set(hospitalId);
    this.procedures.set([]);
    this.selectedProcedureId.set('');
    this.procedureMetrics.set(null);
    this.loadHospitalProcedures(hospitalId);
  }

  protected onProcedureChange(procedureId: string): void {
    this.selectedProcedureId.set(procedureId);
    this.loadProcedureMetrics();
  }

  protected retryAnalytics(): void {
    this.loadAnalytics();
  }

  protected retryProcedures(): void {
    if (this.role() === 'ADMIN') {
      this.loadHospitalProcedures(this.selectedHospitalId());
    } else {
      this.loadProcedures();
    }
  }

  protected retryProcedureMetrics(): void {
    this.loadProcedureMetrics();
  }

  protected prevPatientPage(): void {
    if (this.patientPage() > 0) this.patientPage.update(page => page - 1);
  }

  protected nextPatientPage(): void {
    if (this.patientPage() < this.totalPatientPages - 1) this.patientPage.update(page => page + 1);
  }

  protected procedureChartData(field: ProcedureFieldMetrics): ChartData<'line'> {
    const requestedStartDate = this.procedureMetrics()?.requestedStartDate;
    if (!requestedStartDate) return { labels: [], datasets: [] };

    const previousWeekStartDate = addDaysToIsoDate(requestedStartDate, -7);
    const averageForWeek = (weekStartDate: string) =>
      Array.from({ length: 7 }, (_, index) => {
        const date = addDaysToIsoDate(weekStartDate, index);
        return field.dailyAverages.find(point => point.date === date)?.average ?? null;
      });

    return {
      labels: WEEKDAY_LABELS,
      datasets: [{
        data: averageForWeek(previousWeekStartDate),
        label: 'Semana anterior',
        borderColor: '#E5A139',
        backgroundColor: 'rgba(229, 161, 57, 0.10)',
        pointBackgroundColor: '#E5A139',
        pointRadius: 3,
        pointHoverRadius: 5,
        borderWidth: 2,
        tension: 0.3,
        spanGaps: false,
      }, {
        data: averageForWeek(requestedStartDate),
        label: 'Semana selecionada',
        borderColor: '#0C4C8A',
        backgroundColor: 'rgba(12, 76, 138, 0.10)',
        pointBackgroundColor: '#0C4C8A',
        pointRadius: 3,
        pointHoverRadius: 5,
        borderWidth: 2,
        tension: 0.3,
        spanGaps: false,
      }],
    };
  }

  protected procedureChartOptions(field: ProcedureFieldMetrics): ChartOptions<'line'> {
    return {
      ...this.dailyLineChartOptions,
      plugins: {
        ...this.dailyLineChartOptions.plugins,
        legend: { display: true, position: 'top' },
        tooltip: {
          callbacks: {
            label: context => {
              const requestedStartDate = this.procedureMetrics()?.requestedStartDate;
              if (!requestedStartDate) return ' Sem dados para este período';
              const weekStartDate = context.datasetIndex === 0
                ? addDaysToIsoDate(requestedStartDate, -7)
                : requestedStartDate;
              const date = addDaysToIsoDate(weekStartDate, context.dataIndex);
              const point = field.dailyAverages.find(item => item.date === date);
              const label = `${context.dataset.label} (${formatDateLabel(date)})`;
              if (!point || point.average === null) return ` ${label}: sem amostras`;
              const unit = field.unit ? ` ${field.unit}` : '';
              return ` ${label}: ${point.average.toLocaleString('pt-BR')}${unit} · ${point.sampleSize} amostras`;
            },
          },
        },
      },
      scales: {
        ...this.dailyLineChartOptions.scales,
        y: {
          ...this.dailyLineChartOptions.scales?.['y'],
          ticks: { color: '#7C8DA1' },
          title: field.unit ? { display: true, text: field.unit, color: '#7C8DA1' } : undefined,
        },
      },
    };
  }

  protected totalFor(metrics: DailyMetric[] | null): number {
    return metrics?.reduce((total, item) => total + item.count, 0) ?? 0;
  }

  private loadAnalytics(): void {
    const startDate = this.analyticsStartDate();
    const endDate = this.analyticsEndDate();
    if (!startDate || !endDate) return;
    const requestId = ++this.analyticsRequestId;

    this.checkinsLoading.set(true);
    this.checkinsError.set(false);
    this.dashboardService.getDailyCheckins(startDate, endDate).pipe(
      finalize(() => {
        if (requestId === this.analyticsRequestId) this.checkinsLoading.set(false);
      }),
    ).subscribe({
      next: metrics => {
        if (requestId === this.analyticsRequestId) this.dailyCheckins.set(metrics);
      },
      error: () => {
        if (requestId === this.analyticsRequestId) this.checkinsError.set(true);
      },
    });

    this.smartwatchLoading.set(true);
    this.smartwatchError.set(false);
    this.dashboardService.getDailySmartwatchPatients(startDate, endDate).pipe(
      finalize(() => {
        if (requestId === this.analyticsRequestId) this.smartwatchLoading.set(false);
      }),
    ).subscribe({
      next: metrics => {
        if (requestId === this.analyticsRequestId) this.dailySmartwatchPatients.set(metrics);
      },
      error: () => {
        if (requestId === this.analyticsRequestId) this.smartwatchError.set(true);
      },
    });

    this.alertsLoading.set(true);
    this.alertsError.set(false);
    this.dashboardService.getDailyAlerts(startDate, endDate).pipe(
      finalize(() => {
        if (requestId === this.analyticsRequestId) this.alertsLoading.set(false);
      }),
    ).subscribe({
      next: metrics => {
        if (requestId === this.analyticsRequestId) this.dailyAlerts.set(metrics);
      },
      error: () => {
        if (requestId === this.analyticsRequestId) this.alertsError.set(true);
      },
    });
  }

  private loadProcedures(): void {
    switch (this.role()) {
      case 'ADMIN':
        this.proceduresLoading.set(true);
        this.proceduresError.set(false);
        this.hospitalService.listAllForSelect().subscribe({
          next: hospitals => {
            this.hospitals.set(hospitals);
            const firstHospital = hospitals[0];
            if (firstHospital) {
              this.selectedHospitalId.set(firstHospital.id);
              this.loadHospitalProcedures(firstHospital.id);
            } else {
              this.proceduresLoading.set(false);
            }
          },
          error: () => {
            this.proceduresLoading.set(false);
            this.proceduresError.set(true);
            this.proceduresError.set(true);
          },
        });
        break;
      case 'HOSPITAL':
        this.loadHospitalProcedures('');
        break;
      case 'DOCTOR':
        this.proceduresLoading.set(true);
        this.proceduresError.set(false);
        this.procedureService.listMyDoctorProcedures().subscribe({
          next: procedures => this.setProcedures(procedures),
          error: () => {
            this.proceduresLoading.set(false);
            this.proceduresError.set(true);
          },
        });
        break;
    }
  }

  private loadHospitalProcedures(hospitalId: string): void {
    if (this.role() === 'ADMIN' && !hospitalId) {
      this.setProcedures([]);
      return;
    }

    this.proceduresLoading.set(true);
    this.proceduresError.set(false);
    this.procedureService.list(this.role() === 'ADMIN' ? hospitalId : null, true).subscribe({
      next: page => this.setProcedures(page.content),
      error: () => {
        this.proceduresLoading.set(false);
        this.proceduresError.set(true);
      },
    });
  }

  private setProcedures(procedures: Procedure[]): void {
    this.procedures.set(procedures);
    this.proceduresLoading.set(false);
    const selectedId = procedures.some(procedure => procedure.id === this.selectedProcedureId())
      ? this.selectedProcedureId()
      : procedures[0]?.id ?? '';
    this.selectedProcedureId.set(selectedId);
    this.loadProcedureMetrics();
  }

  private loadProcedureMetrics(): void {
    const requestId = ++this.procedureMetricsRequestId;
    if (!this.isSevenDayRange()) {
      this.procedureMetrics.set(null);
      this.procedureMetricsError.set(false);
      this.procedureMetricsLoading.set(false);
      return;
    }

    const procedureId = this.selectedProcedureId();
    if (!procedureId) {
      this.procedureMetrics.set(null);
      this.procedureMetricsError.set(false);
      this.procedureMetricsLoading.set(false);
      return;
    }

    this.procedureMetricsLoading.set(true);
    this.procedureMetricsError.set(false);
    this.dashboardService.getProcedureMetrics(
      procedureId,
      this.analyticsStartDate(),
      this.analyticsEndDate(),
    ).pipe(finalize(() => {
      if (requestId === this.procedureMetricsRequestId) this.procedureMetricsLoading.set(false);
    })).subscribe({
      next: metrics => {
        if (requestId === this.procedureMetricsRequestId) this.procedureMetrics.set(metrics);
      },
      error: () => {
        if (requestId === this.procedureMetricsRequestId) this.procedureMetricsError.set(true);
      },
    });
  }

  private dailyMetricChartData(metrics: DailyMetric[] | null, label: string, color: string): ChartData<'line'> {
    return {
      labels: metrics?.map(item => formatDateLabel(item.date)) ?? [],
      datasets: [{
        data: metrics?.map(item => item.count) ?? [],
        label,
        borderColor: color,
        backgroundColor: `${color}1A`,
        pointBackgroundColor: color,
        pointRadius: 3,
        pointHoverRadius: 5,
        borderWidth: 2,
        tension: 0.3,
        fill: true,
      }],
    };
  }

  private loadHospitalDashboard(): void {
    this.loading.set(true);
    this.dashboardService.getHospitalDashboard().subscribe({
      next: data => {
        this.hospitalDashboard.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private loadAdminSummary(): void {
    this.loading.set(true);
    this.dashboardService.getAdminSummary().subscribe({
      next: data => {
        this.summary.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private loadDoctorDashboard(): void {
    this.loading.set(true);
    this.dashboardService.getDoctorDashboard().subscribe({
      next: data => {
        this.doctorDashboard.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}

function formatDateLabel(value: string): string {
  const [year, month, day] = value.split('-');
  return `${day}/${month}`;
}

function addDaysToIsoDate(value: string, days: number): string {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}
