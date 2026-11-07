import type {
  ApiResponse,
  PaginatedApiResponse,
} from './api';

/* ======================================================
   ENUMS / UNION TYPES
====================================================== */

export type ClinicDentistInviteStatus =
  | 'pending'
  | 'accepted'
  | 'declined';

export type ClinicDentistInviteAction =
  | 'accept'
  | 'decline';

/* ======================================================
   RELATED ENTITY SUMMARIES
====================================================== */

export interface InviteClinicSummary {
  id: number;
  user_id?: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  is_active?: boolean;
}

export interface InviteDentistSummary {
  id: number;
  user_id?: number;
  name: string;
  specialization?: string | null;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
}

/* ======================================================
   CLINIC-DENTIST INVITATION
====================================================== */

export interface ClinicDentistInvite {
  id: number;
  clinic_id: number;
  dentist_id: number;
  initiated_by_user_id: number;
  responded_by_user_id: number | null;
  status: ClinicDentistInviteStatus;
  responded_at: string | null;
  created_at: string;
  updated_at: string;

  clinic?: InviteClinicSummary;
  dentist?: InviteDentistSummary;
}

/* ======================================================
   CREATE / RESPOND PAYLOADS
====================================================== */

/**
 * Payload for a clinic inviting a dentist.
 */
export interface CreateClinicInvitePayload {
  dentist_id: number;
}

/**
 * Payload for a dentist inviting a clinic.
 */
export interface CreateDentistInvitePayload {
  clinic_id: number;
}

/**
 * Payload for accepting or declining an invitation.
 */
export interface RespondToInvitePayload {
  response: ClinicDentistInviteAction;
}

/* ======================================================
   API RESPONSE TYPES
====================================================== */

export type ClinicDentistInviteApiResponse =
  ApiResponse<ClinicDentistInvite>;

export type ClinicDentistInviteListResponse =
  PaginatedApiResponse<ClinicDentistInvite>;