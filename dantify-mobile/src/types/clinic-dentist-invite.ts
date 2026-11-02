
export type ClinicDentistInviteStatus =
  | 'pending'
  | 'accepted'
  | 'declined';

export type ClinicDentistInviteResponse = 'accept' | 'decline';

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

export interface ClinicDentistInviteApiResponse {
  message: string;
  data: ClinicDentistInvite;
}

export interface ClinicDentistInviteListResponse {
  message: string;
  data: {
    current_page: number;
    data: ClinicDentistInvite[];
    first_page_url?: string | null;
    from?: number | null;
    last_page: number;
    last_page_url?: string | null;
    next_page_url?: string | null;
    path?: string;
    per_page: number;
    prev_page_url?: string | null;
    to?: number | null;
    total: number;
  };
}

export interface CreateClinicInvitePayload {
  dentist_id: number;
}

export interface CreateDentistInvitePayload {
  clinic_id: number;
}

export interface RespondToInvitePayload {
  response: ClinicDentistInviteResponse;
}
