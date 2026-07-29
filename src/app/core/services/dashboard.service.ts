import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';

export interface DashboardSummary {
  totalHospitals: number;
  totalDoctors: number;
  totalPatients: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private api = inject(ApiService);

  getSummary(): Observable<DashboardSummary> {
    return this.api.get<any>('/api/dashboard').pipe(
      map(response => ({
        totalHospitals: response.data.totalHospitals,
        totalDoctors: response.data.totalDoctors,
        totalPatients: response.data.totalPatients
      }))
    );
  }
}
