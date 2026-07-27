import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Hospital } from '../models/entities/hospital.model';

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

  getById(id: number): Observable<Hospital> {
    return this.api.get<Hospital>(`/api/hospitals/${id}`);
  }

  update(id: number, body: UpdateHospitalRequest): Observable<Hospital> {
    return this.api.put<Hospital>(`/api/hospitals/${id}`, body);
  }
}
