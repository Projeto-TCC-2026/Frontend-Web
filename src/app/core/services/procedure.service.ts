import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';

export interface ProcedureHospitalRef {
  id: string;
  name: string;
}

export interface Procedure {
  id: string;
  hospital?: ProcedureHospitalRef;
  title: string;
  description?: string;
  estimatedDuration?: number;
  active: boolean;
}

export interface ProcedurePage {
  content: Procedure[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface ProcedureRequest {
  title: string;
  description: string;
  estimatedDuration: number | null;
  active: boolean;
}

export interface DoctorProcedureAssignment {
  id: string;
  doctor: { id: string; fullName: string };
  procedure: { id: string; title: string };
}

@Injectable({ providedIn: 'root' })
export class ProcedureService {
  private api = inject(ApiService);

  list(hospitalId: string | null, includeInactive = false): Observable<ProcedurePage> {
    const path = hospitalId ? '/api/admin/procedures' : '/api/hospital/procedures';
    const params: Record<string, string | number | boolean> = { page: 0, size: 100, includeInactive };
    if (hospitalId) params['hospitalId'] = hospitalId;
    return this.api.get<any>(path, params).pipe(map(response => response.data ?? response));
  }

  create(hospitalId: string | null, body: ProcedureRequest): Observable<Procedure> {
    const path = hospitalId ? '/api/admin/procedures' : '/api/hospital/procedures';
    const request = hospitalId ? this.api.post<any>(`${path}?hospitalId=${encodeURIComponent(hospitalId)}`, body) : this.api.post<any>(path, body);
    return request.pipe(map(response => response.data ?? response));
  }

  update(hospitalId: string | null, id: string, body: ProcedureRequest): Observable<Procedure> {
    const path = hospitalId ? `/api/admin/procedures/${id}` : `/api/hospital/procedures/${id}`;
    const request = hospitalId ? this.api.put<any>(`${path}?hospitalId=${encodeURIComponent(hospitalId)}`, body) : this.api.put<any>(path, body);
    return request.pipe(map(response => response.data ?? response));
  }

  deactivate(hospitalId: string | null, id: string): Observable<void> {
    const path = hospitalId ? `/api/admin/procedures/${id}` : `/api/hospital/procedures/${id}`;
    const request = hospitalId ? this.api.delete<any>(`${path}?hospitalId=${encodeURIComponent(hospitalId)}`) : this.api.delete<any>(path);
    return request.pipe(map(response => response.data ?? response));
  }

  listDoctorProcedures(doctorId: string, admin: boolean): Observable<DoctorProcedureAssignment[]> {
    const path = admin ? `/api/doctors/${doctorId}/procedures` : `/api/hospital/doctors/${doctorId}/procedures`;
    return this.api.get<any>(path).pipe(map(response => response.data ?? response));
  }

  assignDoctor(procedureId: string, doctorId: string, admin: boolean): Observable<DoctorProcedureAssignment> {
    const path = admin ? `/api/admin/procedures/${procedureId}/doctors` : `/api/hospital/procedures/${procedureId}/doctors`;
    return this.api.post<any>(path, { doctorId }).pipe(map(response => response.data ?? response));
  }

  unassignDoctor(procedureId: string, doctorId: string, admin: boolean): Observable<void> {
    const path = admin
      ? `/api/admin/procedures/${procedureId}/doctors/${doctorId}`
      : `/api/hospital/procedures/${procedureId}/doctors/${doctorId}`;
    return this.api.delete<any>(path).pipe(map(response => response.data ?? response));
  }
}
