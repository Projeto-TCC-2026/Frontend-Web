import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Patient, PatientListItem, PatientCreateRequest, PatientUpdateRequest, PatientFilters } from '../models/entities/patient.model';

export interface PaginatedResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
  };
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}

@Injectable({ providedIn: 'root' })
export class PatientService {
  private api = inject(ApiService);

  // ========================================
  // CRUD Operations
  // ========================================

  /**
   * Listar todos os pacientes ativos (paginado)
   * Acesso: DOCTOR, ADMIN
   */
  getAll(page = 0, size = 10, sort = 'fullName,asc'): Observable<PaginatedResponse<PatientListItem>> {
    return this.api.get<PaginatedResponse<PatientListItem>>('/api/patients', { 
      page: page.toString(), 
      size: size.toString(), 
      sort 
    });
  }

  /**
   * Buscar paciente por ID
   * Acesso: DOCTOR, ADMIN
   */
  getById(id: string): Observable<Patient> {
    return this.api.get<Patient>(`/api/patients/${id}`);
  }

  /**
   * Criar novo paciente
   * Acesso: DOCTOR, ADMIN
   */
  create(patient: PatientCreateRequest): Observable<Patient> {
    return this.api.post<Patient>('/api/patients', patient);
  }

  /**
   * Atualizar paciente
   * Acesso: DOCTOR, ADMIN
   */
  update(id: string, patient: PatientUpdateRequest): Observable<Patient> {
    return this.api.put<Patient>(`/api/patients/${id}`, patient);
  }

  /**
   * Excluir paciente (hard delete)
   * Acesso: ADMIN apenas
   */
  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/api/patients/${id}`);
  }

  /**
   * Inativar paciente (soft delete)
   * Acesso: DOCTOR, ADMIN
   */
  deactivate(id: string): Observable<void> {
    return this.api.patch<void>(`/api/patients/${id}/inactive`);
  }

  // ========================================
  // Search Operations
  // ========================================

  /**
   * Buscar pacientes por nome (paginado)
   */
  searchByName(name: string, page = 0, size = 10, sort = 'fullName,asc'): Observable<PaginatedResponse<PatientListItem>> {
    return this.api.get<PaginatedResponse<PatientListItem>>('/api/patients/search/name', {
      name,
      page: page.toString(),
      size: size.toString(),
      sort
    });
  }

  /**
   * Buscar pacientes por CPF (paginado)
   */
  searchByCpf(cpf: string, page = 0, size = 10): Observable<PaginatedResponse<PatientListItem>> {
    return this.api.get<PaginatedResponse<PatientListItem>>('/api/patients/search/cpf', {
      cpf,
      page: page.toString(),
      size: size.toString()
    });
  }

  /**
   * Buscar pacientes por email (paginado)
   */
  searchByEmail(email: string, page = 0, size = 10): Observable<PaginatedResponse<PatientListItem>> {
    return this.api.get<PaginatedResponse<PatientListItem>>('/api/patients/search/email', {
      email,
      page: page.toString(),
      size: size.toString()
    });
  }

  /**
   * Buscar pacientes por telefone (paginado)
   */
  searchByPhone(phone: string, page = 0, size = 10): Observable<PaginatedResponse<PatientListItem>> {
    return this.api.get<PaginatedResponse<PatientListItem>>('/api/patients/search/phone', {
      phone,
      page: page.toString(),
      size: size.toString()
    });
  }

  /**
   * Filtrar pacientes por múltiplos critérios
   */
  filter(filters: PatientFilters): Observable<PaginatedResponse<PatientListItem>> {
    const params: Record<string, string> = {
      page: (filters.page || 0).toString(),
      size: (filters.size || 10).toString()
    };

    if (filters.name) params['name'] = filters.name;
    if (filters.gender) params['gender'] = filters.gender;
    if (filters.city) params['city'] = filters.city;
    if (filters.state) params['state'] = filters.state;
    if (filters.sort) params['sort'] = filters.sort;

    return this.api.get<PaginatedResponse<PatientListItem>>('/api/patients/filter', params);
  }

  // ========================================
  // Procedure Operations
  // ========================================

  /**
   * Listar procedimentos de um paciente
   */
  getPatientProcedures(patientId: string, page = 0, size = 10, sort = 'executionDate,desc') {
    return this.api.get(`/api/patients/${patientId}/procedures`, {
      page: page.toString(),
      size: size.toString(),
      sort
    });
  }

  /**
   * Contar procedimentos de um paciente
   */
  countPatientProcedures(patientId: string): Observable<number> {
    return this.api.get<number>(`/api/patients/${patientId}/procedures/count`);
  }
}