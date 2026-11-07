import type { Address } from './address';
import type {
  ApiResponse,
  PaginatedApiResponse,
} from './api';

/* ======================================================
   STAFF
====================================================== */

export interface Staff extends Address {
  id: number;
  user_id: number;
  clinic_id: number;
  name: string;
  job_title: string | null;
  gender: string | null;
  dob?: string | null;
  phone: string | null;
  email: string | null;
  profile_photo_path?: string | null;
  profile_photo_url: string | null;
  is_active: boolean;
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

export interface StaffCreatePayload extends Partial<Address> {
  clinic_id: number;
  name: string;
  job_title?: string | null;
  gender?: string | null;
  dob?: string | null;
  phone?: string | null;
  email?: string | null;
  is_active?: boolean;
  profile_photo?: ProfilePhotoPayload | null;
}

export interface StaffUpdatePayload extends Partial<Address> {
  clinic_id?: number;
  name?: string;
  job_title?: string | null;
  gender?: string | null;
  dob?: string | null;
  phone?: string | null;
  email?: string | null;
  is_active?: boolean;
  profile_photo?: ProfilePhotoPayload | null;
  remove_profile_photo?: boolean;
}

/* ======================================================
   API RESPONSE TYPES
====================================================== */

export interface MyStaffProfileResponse
  extends ApiResponse<Staff | null> {
  next_step: 'create_profile' | 'dashboard';
}

export type PaginatedStaffsResponse =
  PaginatedApiResponse<Staff>;

/* ======================================================
   RELATED CLINIC INFORMATION
====================================================== */

export interface StaffClinicInfo {
  id: number;
  name: string;
  address?: string | null;
  city?: string | null;
  country?: string | null;
}