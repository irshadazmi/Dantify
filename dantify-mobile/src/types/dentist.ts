/* ======================================================
   DENTIST TYPES – aligned with Laravel Dentist model
====================================================== */

import type { Address } from './address';

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

export interface DentistCreatePayload extends Address {
  name: string;
  gender?: string | null;
  phone?: string | null;
  email?: string | null;
  specialization?: string | null;
  profile_photo?: { uri: string; name: string; type: string } | null;
}

export interface DentistUpdatePayload extends Partial<Address> {
  name?: string;
  gender?: string | null;
  phone?: string | null;
  email?: string | null;
  specialization?: string | null;
  profile_photo?: { uri: string; name: string; type: string } | null;
  remove_profile_photo?: boolean;
}

export interface MyDentistProfileResponse {
  message?: string;
  next_step: 'create_profile' | 'dashboard';
  data: Dentist | null;
}

/** Laravel paginator returned as { message, data: { data: Dentist[], ... } }. */
export interface PaginatedDentistsResponse {
  message?: string;
  data: {
    data: Dentist[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    next_page_url?: string | null;
    prev_page_url?: string | null;
  };
}

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

export interface DentistDetails extends Dentist {
  clinics?: DentistClinicInfo[];
}

export interface DentistDetailsResponse {
  data: DentistDetails;
}
