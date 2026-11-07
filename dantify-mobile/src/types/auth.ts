import type { ApiResponse } from './api';

/* ======================================================
   ROLE TYPES
====================================================== */

/**
 * Role names returned by the API.
 * Open-ended to support future server-managed roles.
 */
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

/* ======================================================
   USER TYPES
====================================================== */

export interface AuthUser {
  id: number;
  email: string;
  phone: string | null;
  role_id: number;

  /** Laravel may return the role as a related object or role name. */
  role: AuthRole | RoleName;

  is_active: boolean;
  email_verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type AuthToken = string;

export type AuthNextStep =
  | 'create_profile'
  | 'complete_profile'
  | 'dashboard'
  | (string & {});

/* ======================================================
   LOGIN
====================================================== */

export interface LoginRequest {
  email: string;
  password: string;
  device_name?: string;
}

/**
 * Profile completion information returned during login.
 * The actual profile structure depends on the user's role.
 */
export interface LoginProfile<T = unknown> {
  required: boolean;
  exists: boolean;
  data: T | null;
  next_step?: AuthNextStep;
}

export interface LoginResponse {
  user: AuthUser;
  profile?: LoginProfile | null;
  next_step?: AuthNextStep;
  token: AuthToken;
  token_type?: string;
}

/* ======================================================
   REGISTRATION
====================================================== */

/**
 * Roles permitted through public mobile registration.
 */
export type PublicRegistrationRole =
  | 'clinic'
  | 'dentist'
  | 'staff'
  | 'laboratory'
  | 'patient';

export interface RegisterRequest {
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  role: PublicRegistrationRole;

  /** Proof returned after successful OTP verification. */
  verification_token: string;

  device_name?: string;
}

/**
 * Registration response.
 * Registration may return an authenticated user and token.
 */
export interface RegisterResponse extends LoginResponse {
  next_step?: AuthNextStep;
}

/* ======================================================
   OTP VERIFICATION
====================================================== */

export interface OtpSendRequest {
  phone: string;
}

export type OtpSendResponse = ApiResponse<{
  expires_in?: number;
}>;

export interface OtpVerifyRequest {
  phone: string;
  otp: string;
}

export interface OtpVerifyResponse {
  message: string;
  verification_token: string;
  expires_in?: number;
}

/* ======================================================
   USER ACCOUNT
====================================================== */

export interface UpdateUserRequest {
  email?: string;
  phone?: string | null;
}

/* ======================================================
   PASSWORD MANAGEMENT
====================================================== */

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
}

/* ======================================================
   API RESPONSE TYPES
====================================================== */

export type LoginApiResponse = ApiResponse<LoginResponse>;

export type RegisterApiResponse = ApiResponse<RegisterResponse>;

export type UserResponse = AuthUser | {
  user: AuthUser;
};

export type UserApiResponse = ApiResponse<UserResponse>;