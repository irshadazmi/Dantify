
/* ======================================================
   DENTIST TYPES – aligned with Laravel Dentist model
====================================================== */

import { Address } from "./address";

/**
 * Full dentist entity returned by the Laravel API.
 */
export interface Dentist extends Address {
  id: number;
  user_id: number;
  name: string;
  gender: string | null;
  phone: string | null;
  email: string | null;
  specialization: string | null;
  created_at: string;
  updated_at: string | null;
}

/* ======================================================
   CREATE / UPDATE PAYLOADS
====================================================== */

/**
 * Payload for POST /api/dentists.
 * user_id is assigned by the authenticated backend user.
 */
export interface DentistCreatePayload extends Address {
  name: string;
  gender?: string | null;
  phone?: string | null;
  email?: string | null;
  specialization?: string | null;
}

/**
 * Payload for PUT/PATCH /api/dentists/{id}.
 */
export interface DentistUpdatePayload extends Partial<Address> {
  name?: string;
  gender?: string | null;
  phone?: string | null;
  email?: string | null;
  specialization?: string | null;
}

/* ======================================================
   API RESPONSE TYPES
====================================================== */

/**
 * GET /api/my/dentist-profile
 *
 * Existing profile:
 * { next_step: 'dashboard', data: Dentist }
 *
 * Missing profile:
 * { next_step: 'create_profile', data: null }
 */
export interface MyDentistProfileResponse {
  message?: string;
  next_step: 'create_profile' | 'dashboard';
  data: Dentist | null;
}

/**
 * Standard paginated Laravel response.
 */
export interface PaginatedDentistsResponse {
  data: Dentist[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

/* ======================================================
   DENTIST-CLINIC ASSOCIATION
====================================================== */

/**
 * Association represented by dentistClinics().
 * Field types should be adjusted to match the migration.
 */
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

/**
 * Clinic information used when the API eager-loads clinics.
 * This is a lightweight shape; use the full Clinic type
 * if the endpoint returns every clinic field.
 */
export interface DentistClinicInfo {
  id: number;
  name: string;
  address?: string | null;
  city?: string | null;
  country?: string | null;
}

/**
 * Many-to-many pivot data returned for a clinic association.
 */
export interface DentistClinicPivot {
  day_of_week: string | null;
  start_time: string | null;
  end_time: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Dentist details for the guest-facing booking screen.
 * Optional fields are only populated when returned by the API.
 */
export interface DentistDetails extends Dentist {
  clinics?: DentistClinicInfo[];
}

export interface DentistDetailsResponse {
  data: DentistDetails;
}