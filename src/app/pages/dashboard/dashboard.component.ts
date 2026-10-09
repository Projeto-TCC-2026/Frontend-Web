import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideUserRound, LucideUsers, LucideClipboardList, LucideChevronLeft, LucideChevronRight } from '@lucide/angular';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { Chart, ArcElement, Tooltip, Legend, PieController } from 'chart.js';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService, DashboardSummary, HospitalDashboard, DoctorDashboard } from '../../core/services/dashboard.service';
import { UserRole } from '../../core/models/entities/user.model';

Chart.register(ArcElement, Tooltip, Legend, PieController);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideUserRound, LucideUsers, LucideClipboardList, LucideChevronLeft, LucideChevronRight, BaseChartDirective],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private dashboardService = inject(DashboardService);

  protected role = signal<UserRole | null>(null);
  protected summary = signal<DashboardSummary | null>(null);
  protected hospitalDashboard = signal<HospitalDashboard | null>(null);
  protected doctorDashboard = signal<DoctorDashboard | null>(null);
  protected loading = signal(false);

  // ─── Gráfico de pizza ────────────────────────────────────────
  protected pieChartData = computed<ChartData<'pie'>>(() => {
    const data = this.hospitalDashboard();
    if (!data?.proceduresByPeriod?.length) {
      return { labels: [], datasets: [{ data: [] }] };
    }
    return {
      labels: data.proceduresByPeriod.map(p => p.period),
      datasets: [{
        data: data.proceduresByPeriod.map(p => p.totalProcedures),
        backgroundColor: [
          '#0C4C8A', '#1A6BC1', '#3A8FD4', '#6AB0E3',
          '#2F9E6E', '#47C48A', '#E5A139', '#D9484B',
          '#142D54', '#AEDEDE',
        ],
        borderWidth: 1,
        borderColor: '#ffffff',
      }],
    };
  });

  protected pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: { size: 12 },
          padding: 16,
          color: '#4B5563',
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${ctx.parsed} procedimentos`,
        },
      },
    },
  };

  // ─── Paginação de últimos pacientes ──────────────────────────
  protected patientPage = signal(0);
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

  protected prevPatientPage(): void {
    if (this.patientPage() > 0) this.patientPage.update(p => p - 1);
  }

  protected nextPatientPage(): void {
    if (this.patientPage() < this.totalPatientPages - 1) this.patientPage.update(p => p + 1);
  }

  // ─── Lifecycle ───────────────────────────────────────────────
  ngOnInit(): void {
    this.role.set(this.auth.getRole());

    if (this.role() === 'HOSPITAL') {
      this.loadHospitalDashboard();
    } else if (this.role() === 'ADMIN') {
      this.loadAdminSummary();
    } else if (this.role() === 'DOCTOR') {
      this.loadDoctorDashboard();
    }
  }

  private loadHospitalDashboard(): void {
    this.loading.set(true);
    this.dashboardService.getHospitalDashboard().subscribe({
      next: (data) => {
        this.hospitalDashboard.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  private loadAdminSummary(): void {
    this.loading.set(true);
    this.dashboardService.getAdminSummary().subscribe({
      next: (data) => {
        this.summary.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  private loadDoctorDashboard(): void {
    this.loading.set(true);
    this.dashboardService.getDoctorDashboard().subscribe({
      next: (data) => {
        this.doctorDashboard.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
