
/* ======================================================
   LABORATORY TYPES – aligned with Laravel Laboratory model
====================================================== */

import type { Address } from './address';

/**
 * Full Laboratory entity returned by the Laravel API.
 */
export interface Laboratory extends Address {
  id: number;
  user_id: number;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  registration_number: string | null;
  notes: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at: string | null;
}

/* ======================================================
   CREATE / UPDATE PAYLOADS
====================================================== */

/**
 * Payload for POST /api/laboratories.
 * user_id is assigned by the authenticated backend user.
 */
export interface LaboratoryCreatePayload extends Address {
  name: string;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  registration_number?: string | null;
  notes?: string | null;
  is_active?: boolean;
}

/**
 * Payload for PUT/PATCH /api/laboratories/{id}.
 * All fields are optional to support partial updates.
 */
export interface LaboratoryUpdatePayload extends Partial<Address> {
  name?: string;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  registration_number?: string | null;
  notes?: string | null;
  is_active?: boolean;
}

/* ======================================================
   API RESPONSE TYPES
====================================================== */

/**
 * GET /api/my/laboratory-profile
 *
 * Existing profile:
 * { next_step: 'dashboard', data: Laboratory }
 *
 * Missing profile:
 * { next_step: 'create_profile', data: null }
 */
export interface MyLaboratoryProfileResponse {
  message?: string;
  next_step: 'create_profile' | 'dashboard';
  data: Laboratory | null;
}

/**
 * Standard paginated Laravel response.
 */
export interface PaginatedLaboratoriesResponse {
  data: Laboratory[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
