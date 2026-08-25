import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';

export type FieldDataType = 'INTEGER' | 'DECIMAL' | 'BOOLEAN' | 'TEXT' | 'SCALE' | 'PHOTO';

export interface DoctorProcedureAssignment {
  id: string;
  procedure: { id: string; title: string; estimatedDuration?: number };
}

export interface FieldThreshold {
  severityOrder: number;
  label: string;
  color: string;
  minValue: number | null;
  maxValue: number | null;
}

export interface DoctorProcedureField {
  id?: string;
  name: string;
  description: string;
  unit: string;
  dataType: FieldDataType;
  metricKey: string;
  required: boolean;
  displayOrder: number;
  minValue: number | null;
  maxValue: number | null;
  normalBoolean: boolean | null;
  active?: boolean;
  thresholds: FieldThreshold[];
}

export interface FieldTypePreset {
  id: string;
  name: string;
  description: string;
  dataType: FieldDataType;
  minValue: number | null;
  maxValue: number | null;
  inputStyle: string;
}

@Injectable({ providedIn: 'root' })
export class DoctorProcedureConfigService {
  private api = inject(ApiService);

  listProcedures(): Observable<DoctorProcedureAssignment[]> {
    return this.api.get<any>('/api/doctor/my-procedures').pipe(map(response => response.data ?? response));
  }

  listFields(assignmentId: string): Observable<DoctorProcedureField[]> {
    return this.api.get<any>(`/api/doctor/my-procedures/${assignmentId}/fields`).pipe(map(response => response.data ?? response));
  }

  saveFields(assignmentId: string, fields: DoctorProcedureField[]): Observable<DoctorProcedureField[]> {
    const payload = fields.map(field => ({
      name: field.name,
      description: field.description,
      unit: field.unit,
      dataType: field.dataType,
      metricKey: field.metricKey,
      required: field.required,
      displayOrder: field.displayOrder,
      minValue: field.minValue,
      maxValue: field.maxValue,
      normalBoolean: field.normalBoolean,
      thresholds: field.thresholds,
    }));
    return this.api.put<any>(`/api/doctor/my-procedures/${assignmentId}/fields`, payload).pipe(map(response => response.data ?? response));
  }

  listPresets(): Observable<FieldTypePreset[]> {
    return this.api.get<any>('/api/doctor/my-procedures/field-type-presets').pipe(map(response => response.data ?? response));
  }
}
