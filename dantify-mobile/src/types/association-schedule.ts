
export type AssociationScheduleStatus =
  | "proposed"
  | "confirmed"
  | "change_requested"
  | "cancelled"
  | "superseded";

export type DayOfWeek =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

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
  proposed_by?: {
    id: number;
    name: string;
  };
  reviewed_by?: {
    id: number;
    name: string;
  } | null;
}

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

export type AssociationScheduleReviewResponse =
  | "confirm"
  | "request_changes";

export interface AssociationScheduleListResponse {
  message: string;
  association?: {
    id: number;
    clinic_id: number;
    dentist_id: number;
    status: string;
  };
  data: {
    current_page: number;
    data: AssociationSchedule[];
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface AssociationScheduleApiResponse {
  message: string;
  data: AssociationSchedule;
}
