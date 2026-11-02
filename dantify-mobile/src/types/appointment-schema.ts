// mobile-app/src/types/appointment-schema.ts

/* ======================================================
   BASE TYPES (DB-ORIENTED)
====================================================== */

export interface AppointmentBaseSchema {
  start_time: string; // ISO datetime (UTC)
  end_time: string;   // ISO datetime (UTC)
  duration_minutes: number;

  notes?: string | null;

  patient_id: number;
  clinic_id: number;
  dentist_id: number;

  appointment_status_id: number;
  created_by_user_id: number;
}

/* ======================================================
   CREATE
====================================================== */

export interface AppointmentCreateSchema
  extends AppointmentBaseSchema {}

/* ======================================================
   UPDATE
====================================================== */

export interface AppointmentUpdateSchema {
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;

  notes?: string | null;
  appointment_status_id?: number;

  canceled_reason?: string | null;
  canceled_by_user_id?: number | null;
  rescheduled_by_user_id?: number | null;
}

/* ======================================================
   CANCEL
====================================================== */

export interface AppointmentCancelSchema {
  canceled_reason?: string | null;
  canceled_by_user_id?: number | null;
}

/* ======================================================
   RESCHEDULE
====================================================== */

export interface AppointmentRescheduleSchema {
  new_start_time: string; // ISO datetime (UTC)
  new_end_time: string;   // ISO datetime (UTC)
  new_duration_minutes: number;
}

/* ======================================================
   RESPONSE (DENORMALIZED / UI-READY)
====================================================== */

export interface AppointmentResponseSchema
  extends AppointmentBaseSchema {
  id: number;

  /* -------------------------------
     STATUS
  -------------------------------- */
  appointment_status_name?: string | null;
  appointment_status_code?: string | null;

  /* -------------------------------
     PATIENT
  -------------------------------- */
  patient_name?: string | null;
  patient_gender?: string | null;
  patient_dob?: string | null;
  patient_age?: number | null;
  patient_phone?: string | null;
  patient_email?: string | null;

  /* -------------------------------
     DENTIST
  -------------------------------- */
  dentist_name?: string | null;
  dentist_specialization?: string | null;

  /* -------------------------------
     CLINIC
  -------------------------------- */
  clinic_name?: string | null;
  clinic_city?: string | null;
  clinic_phone?: string | null;

  /* -------------------------------
     LIFECYCLE
  -------------------------------- */
  canceled_reason?: string | null;
  canceled_by_user_id?: number | null;
  rescheduled_by_user_id?: number | null;

  /* -------------------------------
     AUDIT
  -------------------------------- */
  created_at: string;
  updated_at: string;
}
