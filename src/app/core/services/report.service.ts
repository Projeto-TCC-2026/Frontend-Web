import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService, QueryParams } from './api.service';

export type CheckinReportPeriod = 'daily' | 'weekly' | 'monthly';

export interface DailyCheckinStatus {
  patientId: string;
  fullName: string;
  checkedIn: boolean;
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly api = inject(ApiService);

  exportCheckins(period: CheckinReportPeriod, filters: QueryParams): Observable<Blob> {
    return this.api.getBlob(`/api/reports/checkins/${period}/export`, filters);
  }

  exportAlerts(filters: QueryParams): Observable<Blob> {
    return this.api.getBlob('/api/reports/alerts/export', filters);
  }

  checkDailyStatus(date: string, patientId: string): Observable<DailyCheckinStatus> {
    return this.api.get<any>('/api/reports/checkins/daily/status', { date, patientId }).pipe(
      map(response => response.data ?? response)
    );
  }

  exportDailyReport(date: string, patientId: string): Observable<Blob> {
    return this.api.getBlob('/api/reports/checkins/daily/export', { date, patientId });
  }
}
