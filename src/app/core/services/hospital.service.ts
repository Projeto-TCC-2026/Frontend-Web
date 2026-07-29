import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
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

@Injectable({ providedIn: 'root' })
export class HospitalService {
  private api = inject(ApiService);

  // Gestão completa de hospitais (para admin)
  getAll(): Observable<Hospital[]> {
    return this.api.get<Hospital[]>('/api/admin/hospitals');
  }

  create(body: CreateHospitalRequest): Observable<Hospital> {
    return this.api.post<Hospital>('/api/admin/hospitals', body);
  }

  activate(id: number): Observable<void> {
    return this.api.patch<void>(`/api/admin/hospitals/${id}/activate`);
  }

  deactivate(id: number): Observable<void> {
    return this.api.patch<void>(`/api/admin/hospitals/${id}/deactivate`);
  }

  deleteHospital(id: number): Observable<void> {
    return this.api.delete<void>(`/api/admin/hospitals/${id}`);
  }

  // Operações específicas (para hospital próprio)
  getById(id: number): Observable<Hospital> {
    return this.api.get<Hospital>(`/api/hospitals/${id}`);
  }

  update(id: number, body: UpdateHospitalRequest): Observable<Hospital> {
    return this.api.put<Hospital>(`/api/hospitals/${id}`, body);
  }
}
