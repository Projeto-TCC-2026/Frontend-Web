import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Doctor } from '../models/entities/doctor.model';

export interface DoctorPage {
  content: Doctor[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface SaveDoctorRequest {
  userId: number;
  hospitalId: number;
  fullName: string;
  cpf: string;
  crm: string;
  specialty: string;
  phone: string;
}

@Injectable({ providedIn: 'root' })
export class DoctorService {
  private api = inject(ApiService);

  getAll(page = 0, size = 20): Observable<DoctorPage> {
    return this.api.get<DoctorPage>('/api/doctors', { page, size });
  }

  getById(id: number): Observable<Doctor> {
    return this.api.get<Doctor>(`/api/doctors/${id}`);
  }

  create(body: SaveDoctorRequest): Observable<Doctor> {
    return this.api.post<Doctor>('/api/doctors', body);
  }

  update(id: number, body: SaveDoctorRequest): Observable<Doctor> {
    return this.api.put<Doctor>(`/api/doctors/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`/api/doctors/${id}`);
  }
}
