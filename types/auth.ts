// Tipos para la autenticación
// Coinciden con el schema de Prisma

export type UserRole = "ADMIN" | "COORDINATOR" | "TEACHER" | "STUDENT" | "PUBLIC";

export type UserStatus = "INVITED" | "ACTIVE" | "INACTIVE" | "SUSPENDED";

export interface User {
  id: string;
  email: string;
  roles: UserRole[]; // Array de roles, según el schema de Prisma
  status: UserStatus;
  name?: string | null;
  schoolId?: string | null;
  lastLogin?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// Request types
export interface LoginPasswordRequest {
  email: string;
  password: string;
}

export interface LoginOTPRequest {
  email: string;
}

// Response types
export interface LoginPasswordResponse {
  success: true;
  user: User;
  session: any; // Tipo de sesión de Supabase
}

export interface LoginOTPResponse {
  success: true;
  message: string;
  email: string;
}

export interface UserResponse {
  user: User;
}

export interface LogoutResponse {
  success: true;
  message: string;
}

export interface ErrorResponse {
  error: string;
}

// Type guards
export function isErrorResponse(response: any): response is ErrorResponse {
  return "error" in response;
}

export function isLoginPasswordResponse(
  response: any
): response is LoginPasswordResponse {
  return "success" in response && "user" in response && "session" in response;
}

export function isLoginOTPResponse(
  response: any
): response is LoginOTPResponse {
  return "success" in response && "message" in response && "email" in response;
}
