import type { Address } from '@/types/address';

/**
 * Full patient entity returned by the backend.
 */
export interface Patient extends Address {
  id: number;
  user_id: number;
  name: string;
  gender: string;
  dob: string; // YYYY-MM-DD
  phone: string | null;
  email: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string | null;
}

/**
 * Payload to create a patient profile.
 * user_id should be derived from the authenticated user on the backend.
 */
export interface PatientCreateRequest extends Address {
  name: string;
  gender: string;
  dob: string; // YYYY-MM-DD
  phone: string | null;
  email: string | null;
  is_active?: boolean;
}

/**
 * Payload to update a patient profile.
 */
export type PatientUpdateRequest = Partial<
  Omit<PatientCreateRequest, 'is_active'>
> & {
  is_active?: boolean;
};

/**
 * API response aliases.
 */
export type PatientResponse = Patient;
export type PatientsResponse = Patient[];

/**
 * Response from GET /api/my/patient-profile.
 */
export interface MyPatientProfileResponse {
  message?: string;
  next_step: 'create_profile' | 'dashboard';
  data: Patient | null;
}

/**
 * Paginated response for patient listings, if returned by the API.
 */
export interface PaginatedPatientsResponse {
  data: Patient[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}