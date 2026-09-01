import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, QueryParams } from './api.service';

export type CheckinReportPeriod = 'daily' | 'weekly' | 'monthly';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly api = inject(ApiService);

  exportCheckins(period: CheckinReportPeriod, filters: QueryParams): Observable<Blob> {
    return this.api.getBlob(`/api/reports/checkins/${period}/export`, filters);
  }

  exportAlerts(filters: QueryParams): Observable<Blob> {
    return this.api.getBlob('/api/reports/alerts/export', filters);
  }
}
