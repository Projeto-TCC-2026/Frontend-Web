import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { Hospital } from '../models/entities/hospital.model';

export interface HospitalRequest {
  name: string;
  cnpj: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
}

export interface HospitalPageResult {
  content: Hospital[];
  number: number;
  totalPages: number;
  totalElements: number;
}

// Mantido por compatibilidade com código existente
export type CreateHospitalRequest = HospitalRequest;
export type UpdateHospitalRequest = HospitalRequest;
export interface HospitalRegisterRequest extends HospitalRequest {
  password?: string;
}

@Injectable({ providedIn: 'root' })
export class HospitalService {
  private api = inject(ApiService);

  /** Lista paginada de hospitais (para a tela de gestão Admin). */
  getAll(page = 0, size = 10): Observable<HospitalPageResult> {
    return this.api
      .get<any>('/api/admin/hospitals', { page, size, sort: 'name,asc' })
      .pipe(
        map(response => {
          const data = response?.data ?? response;
          return {
            content: data?.content ?? [],
            number: data?.number ?? 0,
            totalPages: data?.totalPages ?? 0,
            totalElements: data?.totalElements ?? 0,
          } as HospitalPageResult;
        }),
      );
  }

  /** Lista enxuta de hospitais para preencher selects (ex.: modal de médicos do ADMIN). */
  listAllForSelect(): Observable<Hospital[]> {
    return this.api
      .get<any>('/api/admin/hospitals', { page: 0, size: 200, sort: 'name,asc' })
      .pipe(map(response => response?.data?.content ?? response?.data ?? []));
  }

  create(body: HospitalRequest): Observable<Hospital> {
    return this.api
      .post<any>('/api/admin/hospitals', body)
      .pipe(map(response => response?.data ?? response));
  }

  getById(id: string): Observable<Hospital> {
    return this.api
      .get<any>(`/api/admin/hospitals/${id}`)
      .pipe(map(response => response?.data ?? response));
  }

  update(id: string, body: HospitalRequest): Observable<Hospital> {
    return this.api
      .put<any>(`/api/admin/hospitals/${id}`, body)
      .pipe(map(response => response?.data ?? response));
  }

  deleteHospital(id: string): Observable<void> {
    return this.api.delete<void>(`/api/admin/hospitals/${id}`);
  }

  enable(id: string): Observable<void> {
    return this.api.patch<void>(`/api/admin/hospitals/${id}/enable`);
  }

  disable(id: string): Observable<void> {
    return this.api.patch<void>(`/api/admin/hospitals/${id}/disable`);
  }

  // ─── Alias mantidos para compatibilidade (usados em outros lugares) ───────
  /** @deprecated use enable() */
  activate(id: string): Observable<void> {
    return this.enable(id);
  }

  /** @deprecated use disable() */
  deactivate(id: string): Observable<void> {
    return this.disable(id);
  }

  // ─── Portal do hospital (usa token para identificar o hospital) ───────────

  register(body: HospitalRegisterRequest): Observable<Hospital> {
    return this.api
      .post<any>('/auth/register/hospital', body)
      .pipe(map(response => response?.data ?? response));
  }

  getOwnProfile(): Observable<Hospital> {
    return this.api
      .get<any>('/api/hospital/profile')
      .pipe(map(response => response?.data ?? response));
  }

  updateOwnProfile(body: HospitalRequest): Observable<Hospital> {
    return this.api
      .put<any>('/api/hospital/profile', body)
      .pipe(map(response => response?.data ?? response));
  }
}
