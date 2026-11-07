import type { Address } from './address';
import type {
  ApiResponse,
  PaginatedApiResponse,
} from './api';

/* ======================================================
   CLINIC ENTITY
====================================================== */

export interface Clinic extends Address {
  id: number;
  user_id: number;
  name: string;

  phone: string | null;
  email: string | null;

  profile_photo_path?: string | null;
  profile_photo_url: string | null;

  is_active: boolean;

  created_at: string;
  updated_at: string | null;
}

/* ======================================================
   PROFILE PHOTO PAYLOAD
====================================================== */

export interface ClinicProfilePhotoPayload {
  uri: string;
  name: string;
  type: string;
}

/* ======================================================
   CREATE / UPDATE PAYLOADS
====================================================== */

export interface ClinicCreatePayload extends Address {
  name: string;
  phone?: string | null;
  email?: string | null;
  is_active?: boolean;
  profile_photo?: ClinicProfilePhotoPayload | null;
}

export interface ClinicUpdatePayload extends Partial<Address> {
  name?: string;
  phone?: string | null;
  email?: string | null;
  is_active?: boolean;
  profile_photo?: ClinicProfilePhotoPayload | null;
  remove_profile_photo?: boolean;
}

/* ======================================================
   API RESPONSE TYPES
====================================================== */

export type ClinicResponse = ApiResponse<Clinic>;

export type ClinicsResponse = ApiResponse<Clinic[]>;

export type MyClinicProfileResponse =
  ApiResponse<Clinic | null> & {
    next_step: 'create_profile' | 'dashboard';
  };

export type PaginatedClinicsResponse =
  PaginatedApiResponse<Clinic>;
