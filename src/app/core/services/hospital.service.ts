import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { Hospital } from '../models/entities/hospital.model';

export interface CreateHospitalRequest {
  name: string;
  cnpj: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
}

export interface UpdateHospitalRequest {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
}

export interface HospitalRegisterRequest {
  name: string;
  cnpj: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class HospitalService {
  private api = inject(ApiService);

  // Auto-cadastro público de hospital
  register(body: HospitalRegisterRequest): Observable<Hospital> {
    return this.api.post<any>('/auth/register/hospital', body).pipe(
      map(response => response.data ?? response)
    );
  }

  // Gestão completa de hospitais (para admin)
  getAll(): Observable<Hospital[]> {
    return this.api.get<Hospital[]>('/api/admin/hospitals');
  }

  /** Lista enxuta de hospitais para preencher selects (ex.: modal de médicos do ADMIN). */
  listAllForSelect(): Observable<Hospital[]> {
    return this.api.get<any>('/api/admin/hospitals', { page: 0, size: 200, sort: 'name,asc' }).pipe(
      map(response => response.data?.content ?? response.data ?? response)
    );
  }

  create(body: CreateHospitalRequest): Observable<Hospital> {
    return this.api.post<Hospital>('/api/admin/hospitals', body);
  }

  activate(id: string): Observable<void> {
    return this.api.patch<void>(`/api/admin/hospitals/${id}/activate`);
  }

  deactivate(id: string): Observable<void> {
    return this.api.patch<void>(`/api/admin/hospitals/${id}/deactivate`);
  }

  deleteHospital(id: string): Observable<void> {
    return this.api.delete<void>(`/api/admin/hospitals/${id}`);
  }

  // Operações por ID (admin)
  getById(id: string): Observable<Hospital> {
    return this.api.get<any>(`/api/hospitals/${id}`).pipe(
      map(response => response.data ?? response)
    );
  }

  update(id: string, body: UpdateHospitalRequest): Observable<Hospital> {
    return this.api.put<any>(`/api/hospitals/${id}`, body).pipe(
      map(response => response.data ?? response)
    );
  }

  // Portal do hospital (usa token para identificar o hospital)
  getOwnProfile(): Observable<Hospital> {
    return this.api.get<any>('/api/hospital/profile').pipe(
      map(response => response.data ?? response)
    );
  }

  updateOwnProfile(body: CreateHospitalRequest | UpdateHospitalRequest): Observable<Hospital> {
    return this.api.put<any>('/api/hospital/profile', body).pipe(
      map(response => response.data ?? response)
    );
  }
}
