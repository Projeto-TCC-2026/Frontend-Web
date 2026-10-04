import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import {
  DoctorAlert,
  DoctorAlertApiResponse,
  DoctorAlertPage,
  DoctorAlertStatus,
} from '../models/entities/doctor-alert.model';

/**
 * Alertas de monitoramento do médico logado.
 * O backend resolve o médico pelo token; não há parâmetro de doctorId.
 */
@Injectable({ providedIn: 'root' })
export class DoctorAlertService {
  private api = inject(ApiService);

  /** GET /api/doctor/alerts — status inválido devolve 400. */
  getAlerts(status: DoctorAlertStatus, page = 0, size = 20): Observable<DoctorAlertPage> {
    return this.api
      .get<DoctorAlertApiResponse<DoctorAlertPage>>('/api/doctor/alerts', { status, page, size })
      .pipe(map(response => response.data));
  }

  /** PATCH /api/doctor/alerts/{id}/resolve — devolve o alerta atualizado. */
  resolve(id: string): Observable<DoctorAlert> {
    return this.api
      .patch<DoctorAlertApiResponse<DoctorAlert>>(`/api/doctor/alerts/${id}/resolve`)
      .pipe(map(response => response.data));
  }
}
