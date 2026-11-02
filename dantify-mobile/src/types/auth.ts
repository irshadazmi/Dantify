/* src/types/auth.ts */

/** Role names returned by the API. Keep this open to support server-managed roles. */
export type RoleName =
  | 'superadmin'
  | 'clinic'
  | 'dentist'
  | 'staff'
  | 'laboratory'
  | 'patient'
  | (string & {});

export interface AuthRole {
  id: number;
  name: RoleName;
  description?: string | null;
}

export interface AuthUser {
  id: number;
  email: string;
  phone: string | null;
  role_id: number;
  /** Laravel normally returns the related role object. */
  role: AuthRole | RoleName;
  is_active: boolean;
  email_verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type AuthToken = string;

export interface LoginRequest {
  email: string;
  password: string;
  device_name?: string;
}

export interface LoginProfile {
  required: boolean;
  exists: boolean;
  data: unknown | null;
  next_step?: string;
}

export interface LoginResponse {
  message?: string;
  user: AuthUser;
  profile?: LoginProfile | null;
  next_step?: 'create_profile' | 'dashboard' | string;
  token: AuthToken;
  token_type?: string;
}

/** Only roles allowed to register through the public mobile registration flow. */
export type PublicRegistrationRole =
  | "clinic"
  | "dentist"
  | "staff"
  | "laboratory"
  | "patient";

export interface RegisterRequest {
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  role: PublicRegistrationRole;
  /** Proof returned by the server after successful OTP verification. */
  verification_token: string;
  device_name?: string;
}

/** Registration is expected to return a token and user so the context can sign in immediately. */
export interface RegisterResponse extends LoginResponse {
  next_step?: 'complete_profile' | string;
}

export interface OtpSendRequest {
  phone: string;
}

export interface OtpSendResponse {
  message: string;
  expires_in?: number;
}

export interface OtpVerifyRequest {
  phone: string;
  otp: string;
}

export interface OtpVerifyResponse {
  message: string;
  verification_token: string;
  expires_in?: number;
}

export interface UpdateUserRequest {
  email?: string;
  phone?: string | null;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
}

/** Common response shape used by endpoints that return either a user or { user }. */
export type UserResponse = AuthUser | { user: AuthUser };
