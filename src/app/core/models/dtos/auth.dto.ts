import { UserRole } from '../entities/user.model';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  email: string;
  role: UserRole;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

/**
 * Envelope padrão da API (`{ success, data, message }`), igual ao usado em
 * `DoctorAlertApiResponse`, mas reutilizável pelos fluxos de senha.
 */
export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * Corpo de `data` devolvido por `/account-activation/activate` e
 * `/forgot-password/reset` (DTO `UserRoleResponse` no backend).
 *
 * `role` é opcional e aceita string solta para que o front continue
 * funcionando se subir antes do backend ou se vier um perfil novo.
 */
export interface UserRoleResponse {
  role?: UserRole | string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface UpdateHospitalProfileRequest {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
}

export interface UpdateDoctorProfileRequest {
  fullName: string;
  specialty: string;
  phone: string;
}
