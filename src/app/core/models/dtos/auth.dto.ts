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
