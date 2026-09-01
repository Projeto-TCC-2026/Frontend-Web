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
