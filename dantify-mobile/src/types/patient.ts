import type { Address } from './address';
import type {
  ApiResponse,
  PaginatedApiResponse,
} from './api';

/* ======================================================
   PATIENT
====================================================== */

export interface Patient extends Address {
  id: number;
  user_id: number;
  name: string;
  gender: string;
  dob: string; // YYYY-MM-DD
  phone: string | null;
  email: string | null;
  profile_photo_path?: string | null;
  profile_photo_url: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string | null;
}

/* ======================================================
   CREATE / UPDATE PAYLOADS
====================================================== */

export interface ProfilePhotoPayload {
  uri: string;
  name: string;
  type: string;
}

export interface PatientCreatePayload extends Address {
  name: string;
  gender?: string | null;
  dob?: string | null;
  phone?: string | null;
  email?: string | null;
  profile_photo?: ProfilePhotoPayload | null;
}

export interface PatientUpdatePayload extends Partial<Address> {
  name?: string;
  gender?: string | null;
  dob?: string | null;
  phone?: string | null;
  email?: string | null;
  profile_photo?: ProfilePhotoPayload | null;
  remove_profile_photo?: boolean;
}

/* ======================================================
   DENTIST PROFILE RESPONSES
====================================================== */

export interface MyPatientProfileResponse
  extends ApiResponse<Patient | null> {
  next_step: 'create_profile' | 'dashboard';
}

export type PaginatedPatientsResponse =
  PaginatedApiResponse<Patient>;