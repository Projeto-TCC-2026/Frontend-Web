import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';

/** Contadores públicos exibidos na landing page. */
export interface PublicStats {
  patients: number;
  doctors: number;
  hospitals: number;
}

@Injectable({ providedIn: 'root' })
export class PublicStatsService {
  private api = inject(ApiService);

  /** Estatísticas públicas — GET /api/public/stats */
  getStats(): Observable<PublicStats> {
    return this.api.get<{ success: boolean; data: PublicStats }>('/api/public/stats').pipe(
      map(response => response.data)
    );
  }
}
