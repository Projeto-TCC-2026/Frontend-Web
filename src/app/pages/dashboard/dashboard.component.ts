import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideUserRound, LucideUsers, LucideClipboardList } from '@lucide/angular';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService, DashboardSummary } from '../../core/services/dashboard.service';
import { UserRole } from '../../core/models/entities/user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, LucideUserRound, LucideUsers, LucideClipboardList],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private dashboardService = inject(DashboardService);

  protected role = signal<UserRole | null>(null);
  protected summary = signal<DashboardSummary | null>(null);
  protected loading = signal(false);

  ngOnInit(): void {
    this.role.set(this.auth.getRole());

    if (this.role() === 'HOSPITAL') {
      this.loadHospitalSummary();
    }
  }

  private loadHospitalSummary(): void {
    this.loading.set(true);
    this.dashboardService.getSummary().subscribe({
      next: (data) => {
        this.summary.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        // erro 5xx já dispara toast via error.interceptor
      },
    });
  }
}
