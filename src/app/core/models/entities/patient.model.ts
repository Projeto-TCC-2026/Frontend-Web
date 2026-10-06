export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type BloodType = 'A_POSITIVE' | 'A_NEGATIVE' | 'B_POSITIVE' | 'B_NEGATIVE' | 'AB_POSITIVE' | 'AB_NEGATIVE' | 'O_POSITIVE' | 'O_NEGATIVE';

export interface PatientDoctorSummary {
  id: string;
  fullName: string;
  crm: string;
  specialty?: string;
}

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
  responsibleDoctor?: PatientDoctorSummary | null;
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

/** Status inicial do vínculo paciente↔procedimento criado junto com o paciente. */
export type PatientProcedureStatus = 'EM_ANDAMENTO';

/** Item de `PatientCreateRequest.procedures`; aceito apenas no POST (o PUT não recebe procedures). */
export interface PatientProcedureCreateItem {
  procedureId: string;
  /** Data local no formato yyyy-MM-dd (sem conversão para UTC). */
  startDate: string;
  status: PatientProcedureStatus;
}

export interface PatientCreateRequest {
  /** Obrigatório quando o requisitante é HOSPITAL; para DOCTOR o backend usa o usuário autenticado. */
  doctorId?: string;
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
  /** Enviado somente no cadastro; o backend não aceita este campo na atualização. */
  procedures?: PatientProcedureCreateItem[];
}

export interface PatientUpdateRequest {
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