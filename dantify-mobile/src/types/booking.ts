import type {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
} from './api';

/* ======================================================
   APPOINTMENT STATUS
====================================================== */

export interface BookingStatus {
  id: number;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
  is_terminal: boolean;
}

/* ======================================================
   RELATED ENTITY SUMMARIES
====================================================== */

export interface BookingPatient {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  gender?: string | null;
  dob?: string | null;
}

export interface BookingDentist {
  id: number;
  name: string;
  specialization?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface BookingClinic {
  id: number;
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  phone?: string | null;
}

/* ======================================================
   CLINIC SERVICE OFFERING

   Used by the patient booking flow to display services
   offered by a selected clinic.
====================================================== */

export interface BookingDentalService {
  id: number;
  name: string;
  description?: string | null;
  is_active?: boolean;
}

export interface BookingClinicServiceOffering {
  id: number;
  clinic_id: number;
  dental_service_id: number;
  price: string | number;
  duration_minutes: number;
  is_active: boolean;
  dental_service?: BookingDentalService;
}

/* ======================================================
   APPOINTMENT SERVICE
====================================================== */

export interface BookingService {
  id: number;
  booking_id: number;
  clinic_service_offering_id: number;
  quantity: number;
  unit_price: string | number;

  clinic_service_offering?: BookingClinicServiceOffering;

  created_at?: string;
  updated_at?: string;
}

/* ======================================================
   APPOINTMENT ENTITY
====================================================== */

export interface Booking {
  id: number;

  patient_id: number;
  dentist_id: number;
  clinic_id: number;
  booking_status_id: number;

  booking_date: string | null;
  notes: string | null;

  created_at: string;
  updated_at: string;

  patient?: BookingPatient;
  dentist?: BookingDentist;
  clinic?: BookingClinic;
  booking_status?: BookingStatus;

  booking_services?: BookingService[];
}

/* ======================================================
   APPOINTMENT SERVICE PAYLOAD
====================================================== */

export interface BookingServicePayload {
  clinic_service_offering_id: number;
  quantity?: number;
}

/* ======================================================
   CREATE APPOINTMENT
====================================================== */

export interface BookingCreatePayload {
  patient_id?: number;
  dentist_id?: number;
  clinic_id: number;

  /**
   * Date and time in a Laravel-parseable format.
   * Example: 2026-11-10 10:30:00
   */
  booking_date: string;

  notes?: string | null;

  services: BookingServicePayload[];
}

/* ======================================================
   UPDATE APPOINTMENT
====================================================== */

export interface BookingUpdatePayload {
  booking_date?: string;
  notes?: string | null;
  services?: BookingServicePayload[];
}

/* ======================================================
   AVAILABILITY REQUEST
====================================================== */

export interface BookingAvailabilityParams {
  dentist_id: number;
  clinic_id: number;
  date: string; // YYYY-MM-DD
  services: BookingServicePayload[];
  /** Exclude the current booking while checking a reschedule slot. */
  exclude_booking_id?: number;
}

/* ======================================================
   AVAILABLE SLOT
====================================================== */

export interface BookingAvailableSlot {
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  duration_minutes: number;
  available: true;
}

/* ======================================================
   AVAILABILITY RESPONSE
====================================================== */

export interface BookingAvailabilityData {
  dentist_id?: number;
  clinic_id?: number;
  date: string;
  duration_minutes: number;
  slots: BookingAvailableSlot[];
}

export type BookingAvailabilityResponse =
  ApiResponse<BookingAvailabilityData>;

/* ======================================================
   CHECK SLOT REQUEST
====================================================== */

export interface BookingCheckSlotParams {
  dentist_id: number;
  clinic_id: number;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  services: BookingServicePayload[];
  exclude_booking_id?: number;
}

/* ======================================================
   CHECK SLOT RESPONSE
====================================================== */

export type BookingSlotUnavailableReason =
  | 'outside_working_schedule'
  | 'past_time'
  | 'booking_conflict'
  | null;

export interface BookingCheckSlotData {
  available: boolean;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  reason: BookingSlotUnavailableReason;
}

export type BookingCheckSlotResponse =
  ApiResponse<BookingCheckSlotData>;

/* ======================================================
   LIST PARAMETERS
====================================================== */

export interface BookingListParams extends PaginationParams {}

/* ======================================================
   PHASE 7 — BOOKING LIFECYCLE
====================================================== */

export interface BookingStatusHistory {
  id: number;
  booking_id: number;
  from_status_id: number | null;
  to_status_id: number;
  changed_by_user_id: number | null;
  remarks: string | null;
  created_at: string;
  from_status?: BookingStatus | null;
  to_status?: BookingStatus;
  changed_by?: { id: number; name?: string; email?: string } | null;
}

export type BookingChangeRequestType = 'CANCELLATION' | 'RESCHEDULE';
export type BookingChangeRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface BookingChangeRequest {
  id: number;
  booking_id: number;
  requested_by_user_id: number;
  request_type: BookingChangeRequestType;
  reason: string;
  requested_booking_date: string | null;
  status: BookingChangeRequestStatus;
  reviewed_by_user_id: number | null;
  reviewed_at: string | null;
  review_remarks: string | null;
  replacement_booking_id: number | null;
  created_at: string;
  updated_at: string;
  requested_by?: { id: number; name?: string; email?: string };
  reviewed_by?: { id: number; name?: string; email?: string } | null;
  replacement_booking?: Booking | null;
}

export interface BookingChangeRequestPayload {
  request_type: BookingChangeRequestType;
  reason: string;
  requested_booking_date?: string;
}

export interface BookingStatusUpdatePayload {
  status: string;
  remarks?: string;
}

export interface BookingChangeRequestReviewPayload {
  decision: 'APPROVED' | 'REJECTED';
  review_remarks?: string;
}

/* ======================================================
   API RESPONSES
====================================================== */

export type BookingResponse = ApiResponse<Booking>;

export type BookingListResponse = PaginatedResponse<Booking>;