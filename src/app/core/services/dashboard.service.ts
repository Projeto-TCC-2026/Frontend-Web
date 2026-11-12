import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';

export interface DashboardSummary {
  totalHospitals: number;
  activeHospitals: number;
  inactiveHospitals: number;
  totalDoctors: number;
  activeDoctors: number;
  inactiveDoctors: number;
  totalPatients: number;
}

export interface ProcedureByPeriod {
  period: string;
  totalProcedures: number;
}

export interface LatestPatient {
  id: string;
  fullName: string;
  birthDate: string;
}

export interface HospitalDashboard {
  totalDoctors: number;
  totalPatients: number;
  activePatients: number;
  totalProcedures: number;
  pendingAlerts: number;
  proceduresByPeriod: ProcedureByPeriod[];
  latestPatients: LatestPatient[];
}

export interface DoctorDashboard {
  totalPatients: number;
  activePatients: number;
  patientsWithAlert: number;
  proceduresExecuted: number;
  newPatientsLast30Days: number;
}

export interface DailyMetric {
  date: string;
  count: number;
}

export interface DailyProcedureAverage {
  date: string;
  average: number | null;
  sampleSize: number;
}

export interface ProcedureFieldMetrics {
  fieldId: string;
  sourceFieldIds: string[];
  name: string;
  dataType: 'INTEGER' | 'DECIMAL' | 'SCALE';
  unit: string | null;
  dailyAverages: DailyProcedureAverage[];
}

export interface ProcedureMetrics {
  procedureId: string;
  requestedStartDate: string;
  requestedEndDate: string;
  dataStartDate: string;
  dataEndDate: string;
  fields: ProcedureFieldMetrics[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private api = inject(ApiService);

  /** Dashboard do ADMIN — GET /api/dashboard/admin */
  getAdminSummary(): Observable<DashboardSummary> {
    return this.api.get<any>('/api/dashboard/admin').pipe(
      map(response => response.data)
    );
  }

  /** Dashboard do HOSPITAL — GET /api/hospital/dashboard */
  getHospitalDashboard(): Observable<HospitalDashboard> {
    return this.api.get<any>('/api/hospital/dashboard').pipe(
      map(response => response.data)
    );
  }

  /** Dashboard do DOCTOR — GET /api/doctor/dashboard */
  getDoctorDashboard(): Observable<DoctorDashboard> {
    return this.api.get<any>('/api/doctor/dashboard').pipe(
      map(response => response.data)
    );
  }

  getDailyCheckins(startDate: string, endDate: string): Observable<DailyMetric[]> {
    return this.api.get<{ data: DailyMetric[] }>('/api/presentation/metrics/daily-checkins', {
      startDate,
      endDate,
    }).pipe(map(response => response.data));
  }

  getDailySmartwatchPatients(startDate: string, endDate: string): Observable<DailyMetric[]> {
    return this.api.get<{ data: DailyMetric[] }>('/api/presentation/metrics/daily-smartwatch-patients', {
      startDate,
      endDate,
    }).pipe(map(response => response.data));
  }

  getDailyAlerts(startDate: string, endDate: string): Observable<DailyMetric[]> {
    return this.api.get<{ data: DailyMetric[] }>('/api/presentation/metrics/daily-alerts', {
      startDate,
      endDate,
    }).pipe(map(response => response.data));
  }

  getProcedureMetrics(procedureId: string, startDate: string, endDate: string): Observable<ProcedureMetrics> {
    return this.api.get<{ data: ProcedureMetrics }>(`/api/presentation/metrics/procedures/${procedureId}`, {
      startDate,
      endDate,
    }).pipe(map(response => response.data));
  }

  /** @deprecated Use getAdminSummary() or getHospitalDashboard() */
  getSummary(): Observable<DashboardSummary> {
    return this.getAdminSummary();
  }
}
