/* src/constants/CONSTANTS.ts */

/* ---------- Roles: match Laravel role.name ---------- */

export const ROLES = {
  SUPER_ADMIN: 'superadmin',
  CLINIC: 'clinic',
  DENTIST: 'dentist',
  STAFF: 'staff',
  PATIENT: 'patient',
  LABORATORY: 'laboratory',
} as const;

export type RoleType = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<RoleType, string> = {
  superadmin: 'Super Admin',
  clinic: 'Clinic Admin',
  dentist: 'Dentist',
  staff: 'Staff',
  patient: 'Patient',
  laboratory: 'Laboratory Provider',
};

/* ---------- Public registration role options ---------- */

export const REGISTRATION_ROLES = {
  CLINIC: ROLES.CLINIC,
  PATIENT: ROLES.PATIENT,
  DENTIST: ROLES.DENTIST,
  LABORATORY: ROLES.LABORATORY,
} as const;

export type RegistrationRole =
  (typeof REGISTRATION_ROLES)[keyof typeof REGISTRATION_ROLES];

export const REGISTRATION_ROLE_OPTIONS = [
  { label: "Clinic", value: REGISTRATION_ROLES.CLINIC },
  { label: "Patient", value: REGISTRATION_ROLES.PATIENT },
  { label: "Dentist", value: REGISTRATION_ROLES.DENTIST },
  { label: "Laboratory", value: REGISTRATION_ROLES.LABORATORY },
] as const;

/* ---------- Gender ---------- */

export const GENDERS = {
  MALE: 'Male',
  FEMALE: 'Female',
  OTHER: 'Other',
} as const;

export type GenderType =
  (typeof GENDERS)[keyof typeof GENDERS];

export const GENDER_OPTIONS: GenderType[] = [
  GENDERS.MALE,
  GENDERS.FEMALE,
  GENDERS.OTHER,
];

/* ---------- Account types ---------- */
/* Retain only if used by an existing account feature. */

export const ACCOUNT_TYPES = [
  'Checking',
  'Savings',
  'Credit',
  'Wallet',
  'Investment',
] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];

/* ---------- Currencies ---------- */

export const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'] as const;

export type Currency = (typeof CURRENCIES)[number];

/* ---------- Feedback ---------- */

export const FEEDBACK_TYPES = [
  'Bug',
  'Calculation',
  'Performance',
  'Feature',
  'Design',
  'Data',
  'Access',
  'Other',
] as const;

export type FeedbackType = (typeof FEEDBACK_TYPES)[number];

/* ---------- Feedback status ---------- */

export const FEEDBACK_STATUSES = [
  'Open',
  'In Progress',
  'Resolved',
  'Closed',
] as const;

export type FeedbackStatus =
  (typeof FEEDBACK_STATUSES)[number];


  /* ======================================================
   APPOINTMENT STATUS CONSTANTS
   IDs match the eight-status BookingStatusSeeder insertion order.
   Prefer status codes from the API for business logic.
====================================================== */

export const APPOINTMENT_STATUSES = {
  PENDING_CONFIRMATION: { id: 1, code: 'PENDING_CONFIRMATION', label: 'Pending Confirmation' },
  CONFIRMED: { id: 2, code: 'CONFIRMED', label: 'Confirmed' },
  CHECKED_IN: { id: 3, code: 'CHECKED_IN', label: 'Checked In' },
  IN_PROGRESS: { id: 4, code: 'IN_PROGRESS', label: 'In Progress' },
  COMPLETED: { id: 5, code: 'COMPLETED', label: 'Completed' },
  CANCELLED: { id: 6, code: 'CANCELLED', label: 'Cancelled' },
  NO_SHOW: { id: 7, code: 'NO_SHOW', label: 'No Show' },
  RESCHEDULED: { id: 8, code: 'RESCHEDULED', label: 'Rescheduled' },
} as const;

export type AppointmentStatusId =
  typeof APPOINTMENT_STATUSES[keyof typeof APPOINTMENT_STATUSES]['id'];

export type AppointmentStatusCode =
  typeof APPOINTMENT_STATUSES[keyof typeof APPOINTMENT_STATUSES]['code'];

export const APPOINTMENT_STATUS_OPTIONS = Object.values(APPOINTMENT_STATUSES);
