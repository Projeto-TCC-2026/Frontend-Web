import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';

export interface DashboardSummary {
  totalHospitals: number;
  totalDoctors: number;
  totalPatients: number;
}

export interface HospitalDashboard {
  totalDoctors: number;
  totalPatients: number;
  totalProcedures: number;
  hospitalName?: string;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private api = inject(ApiService);

  /** Dashboard do ADMIN — GET /api/dashboard */
  getAdminSummary(): Observable<DashboardSummary> {
    return this.api.get<any>('/api/dashboard').pipe(
      map(response => response.data)
    );
  }

  /** Dashboard do HOSPITAL — GET /api/hospital/dashboard */
  getHospitalDashboard(): Observable<HospitalDashboard> {
    return this.api.get<any>('/api/hospital/dashboard').pipe(
      map(response => response.data)
    );
  }

  /** @deprecated Use getAdminSummary() or getHospitalDashboard() */
  getSummary(): Observable<DashboardSummary> {
    return this.getAdminSummary();
  }
}
