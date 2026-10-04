import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideUserRound, LucideUsers, LucideClipboardList } from '@lucide/angular';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService, DashboardSummary, HospitalDashboard, DoctorDashboard } from '../../core/services/dashboard.service';
import { UserRole } from '../../core/models/entities/user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideUserRound, LucideUsers, LucideClipboardList],
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
