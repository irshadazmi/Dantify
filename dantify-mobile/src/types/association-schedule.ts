import type {
  ApiResponse,
  PaginatedApiResponse,
} from './api';

/* ======================================================
   ENUMS / UNION TYPES
====================================================== */

export type AssociationScheduleStatus =
  | 'proposed'
  | 'approved'
  | 'confirmed'
  | 'change_requested'
  | 'cancelled'
  | 'superseded';

export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export type AssociationScheduleReviewResponse =
  | 'confirm'
  | 'request_changes';

/* ======================================================
   RELATED TYPES
====================================================== */

export interface AssociationScheduleUser {
  id: number;
  name: string;
}

export interface AssociationSummary {
  id: number;
  clinic_id: number;
  dentist_id: number;
  status: string;
}

/* ======================================================
   ASSOCIATION SCHEDULE SLOT
====================================================== */

export interface AssociationScheduleSlot {
  id: number;
  association_schedule_id: number | null;
  clinic_id: number;
  dentist_id: number;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  created_at?: string;
  updated_at?: string;
}

/* ======================================================
   ASSOCIATION SCHEDULE
====================================================== */

export interface AssociationSchedule {
  id: number;
  clinic_dentist_invite_id: number;
  proposed_by_user_id: number;
  reviewed_by_user_id: number | null;
  effective_from: string;
  effective_until: string | null;
  status: AssociationScheduleStatus;
  notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;

  slots: AssociationScheduleSlot[];

  proposed_by?: AssociationScheduleUser;
  reviewed_by?: AssociationScheduleUser | null;
}

/* ======================================================
   CREATE / UPDATE PAYLOADS
====================================================== */

export interface ScheduleSlotPayload {
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
}

export interface CreateAssociationSchedulePayload {
  effective_from: string;
  effective_until?: string | null;
  notes?: string | null;
  slots: ScheduleSlotPayload[];
}

/* ======================================================
   API RESPONSE TYPES
====================================================== */

export type AssociationScheduleApiResponse =
  ApiResponse<AssociationSchedule>;

export type AssociationScheduleListResponse =
  PaginatedApiResponse<AssociationSchedule> & {
    association?: AssociationSummary;
  };
