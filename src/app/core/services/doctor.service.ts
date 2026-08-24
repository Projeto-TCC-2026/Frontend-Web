import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { Doctor } from '../models/entities/doctor.model';

export interface DoctorPage {
  content: Doctor[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface SaveDoctorRequest {
  userId: string;
  hospitalId: string;
  fullName: string;
  cpf: string;
  crm: string;
  specialty: string;
  phone: string;
}

/** Cadastro sem userId/senha: o backend cria a conta e envia o e-mail de boas-vindas. */
export interface RegisterDoctorRequest {
  email: string;
  hospitalId: string;
  fullName: string;
  cpf: string;
  crm: string;
  specialty: string;
  phone: string;
}

export interface DoctorRegistrationResponse {
  doctor: Doctor;
  activationLink: string;
}

@Injectable({ providedIn: 'root' })
export class DoctorService {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  getAll(page = 0, size = 20): Observable<DoctorPage> {
    if (this.auth.getRole() === 'HOSPITAL') {
      return this.api.get<any>('/api/hospital/doctors', { page, size }).pipe(
        map(response => response.data ?? response)
      );
    }
    return this.api.get<any>('/api/doctors', { page, size }).pipe(
      map(response => response.data ?? response)
    );
  }

  getById(id: string): Observable<Doctor> {
    if (this.auth.getRole() === 'HOSPITAL') {
      return this.api.get<any>(`/api/hospital/doctors/${id}`).pipe(
        map(response => response.data ?? response)
      );
    }
    return this.api.get<any>(`/api/doctors/${id}`).pipe(
      map(response => response.data ?? response)
    );
  }

  create(body: SaveDoctorRequest): Observable<Doctor> {
    if (this.auth.getRole() === 'HOSPITAL') {
      return this.api.post<any>('/api/hospital/doctors', body).pipe(
        map(response => response.data ?? response)
      );
    }
    return this.api.post<any>('/api/doctors', body).pipe(
      map(response => response.data ?? response)
    );
  }

  /** Cria o médico e a conta de acesso dele; dispara o e-mail de boas-vindas para definir a senha. */
  register(body: RegisterDoctorRequest): Observable<DoctorRegistrationResponse> {
    if (this.auth.getRole() === 'HOSPITAL') {
      return this.api.post<any>('/api/hospital/doctors/register', body).pipe(
        map(response => response.data ?? response)
      );
    }
    return this.api.post<any>('/api/doctors/register', body).pipe(
      map(response => response.data ?? response)
    );
  }

  update(id: string, body: SaveDoctorRequest): Observable<Doctor> {
    if (this.auth.getRole() === 'HOSPITAL') {
      return this.api.put<any>(`/api/hospital/doctors/${id}`, body).pipe(
        map(response => response.data ?? response)
      );
    }
    return this.api.put<any>(`/api/doctors/${id}`, body).pipe(
      map(response => response.data ?? response)
    );
  }

  delete(id: string): Observable<void> {
    if (this.auth.getRole() === 'HOSPITAL') {
      return this.api.delete<any>(`/api/hospital/doctors/${id}`).pipe(
        map(response => response.data ?? response)
      );
    }
    return this.api.delete<any>(`/api/doctors/${id}`).pipe(
      map(response => response.data ?? response)
    );
  }
}
