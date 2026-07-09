export type UserRole = 'ADMIN' | 'DOCTOR' | 'PATIENT';

export interface UserProfile {
  id: number;
  email: string;
  role: UserRole;
  fullName?: string;
  doctorId?: number;
  crm?: string;
  specialty?: string;
  hospitalName?: string;
}
