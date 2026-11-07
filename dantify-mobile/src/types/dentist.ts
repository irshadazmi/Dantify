import type { Address } from './address';
import type {
  ApiResponse,
  PaginatedApiResponse,
} from './api';

/* ======================================================
   DENTIST
====================================================== */

export interface Dentist extends Address {
  id: number;
  user_id: number;
  name: string;
  gender: string | null;
  phone: string | null;
  email: string | null;
  profile_photo_path?: string | null;
  profile_photo_url: string | null;
  specialization: string | null;
  created_at: string;
  updated_at: string | null;
}

/* ======================================================
   CREATE / UPDATE PAYLOADS
====================================================== */

export interface ProfilePhotoPayload {
  uri: string;
  name: string;
  type: string;
}

export interface DentistCreatePayload extends Address {
  name: string;
  gender?: string | null;
  phone?: string | null;
  email?: string | null;
  specialization?: string | null;
  profile_photo?: ProfilePhotoPayload | null;
}

export interface DentistUpdatePayload extends Partial<Address> {
  name?: string;
  gender?: string | null;
  phone?: string | null;
  email?: string | null;
  specialization?: string | null;
  profile_photo?: ProfilePhotoPayload | null;
  remove_profile_photo?: boolean;
}

/* ======================================================
   DENTIST PROFILE RESPONSES
====================================================== */

export interface MyDentistProfileResponse
  extends ApiResponse<Dentist | null> {
  next_step: 'create_profile' | 'dashboard';
}

export type PaginatedDentistsResponse =
  PaginatedApiResponse<Dentist>;

/* ======================================================
   CLINIC ASSOCIATION
====================================================== */

export interface DentistClinic {
  id: number;
  dentist_id: number;
  clinic_id: number;
  day_of_week: string | null;
  start_time: string | null;
  end_time: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DentistClinicInfo {
  id: number;
  name: string;
  address?: string | null;
  city?: string | null;
  country?: string | null;
}

export interface DentistClinicPivot {
  day_of_week: string | null;
  start_time: string | null;
  end_time: string | null;
  created_at?: string;
  updated_at?: string;
}

/* ======================================================
   DENTIST DETAILS
====================================================== */

export interface DentistDetails extends Dentist {
  clinics?: DentistClinicInfo[];
}

export type DentistDetailsResponse =
  ApiResponse<DentistDetails>;