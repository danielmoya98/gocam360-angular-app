export type UserRole = 'SUPER_ADMIN' | 'SUPERADMIN' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  tenantName?: string;
}

export interface LoginResponseDto {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
}

export interface CheckSessionResponseDto {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface ChangePasswordResponseDto {
  message: string;
}
