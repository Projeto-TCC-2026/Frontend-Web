export type UserRole = 'ADMIN' | 'HOSPITAL' | 'DOCTOR' | 'PATIENT';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  fullName?: string;
  doctorId?: string;
  crm?: string;
  specialty?: string;
  hospitalName?: string;
}
