import type { Address } from './address';
import type {
  ApiResponse,
  PaginatedApiResponse,
} from './api';

/* ======================================================
   LABORATORY
====================================================== */

export interface Laboratory extends Address {
  id: number;
  user_id: number;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  profile_photo_path?: string | null;
  profile_photo_url: string | null;
  registration_number: string | null;
  notes: string | null;
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

export interface LaboratoryCreatePayload extends Address {
  name: string;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  registration_number?: string | null;
  notes?: string | null;
  is_active?: boolean;
  profile_photo?: ProfilePhotoPayload | null;
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
  profile_photo?: ProfilePhotoPayload | null;
  remove_profile_photo?: boolean;
}

/* ======================================================
   LABORATORY PROFILE RESPONSES
====================================================== */

export interface MyLaboratoryProfileResponse
  extends ApiResponse<Laboratory | null> {
  next_step: 'create_profile' | 'dashboard';
}

export type PaginatedLaboratoriesResponse =
  PaginatedApiResponse<Laboratory>;