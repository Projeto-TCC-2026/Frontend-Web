export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type BloodType = 'A_POSITIVE' | 'A_NEGATIVE' | 'B_POSITIVE' | 'B_NEGATIVE' | 'AB_POSITIVE' | 'AB_NEGATIVE' | 'O_POSITIVE' | 'O_NEGATIVE';

export interface Patient {
  id: string;
  userId?: string;
  fullName: string;
  cpf: string;
  birthDate: string; // ISO date string
  gender?: Gender;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  bloodType?: BloodType;
  weight?: number;
  height?: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PatientListItem {
  id: string;
  fullName: string;
  cpf: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  active: boolean;
  birthDate?: string;
  gender?: Gender;
}

export interface PatientCreateRequest {
  userId: string;
  fullName: string;
  cpf: string;
  birthDate: string;
  gender?: Gender;
  bloodType?: BloodType;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  weight?: number;
  height?: number;
}

export interface PatientUpdateRequest {
  userId: string;
  fullName: string;
  cpf: string;
  birthDate: string;
  gender?: Gender;
  bloodType?: BloodType;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  weight?: number;
  height?: number;
}

export interface PatientFilters {
  name?: string;
  gender?: Gender;
  city?: string;
  state?: string;
  page?: number;
  size?: number;
  sort?: string;
}