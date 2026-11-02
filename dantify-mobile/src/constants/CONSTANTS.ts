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
====================================================== */

export const APPOINTMENT_STATUSES = {
  SCHEDULED: { id: 1, label: "Scheduled" },
  CONFIRMED: { id: 2, label: "Confirmed" },
  CHECKED_IN: { id: 3, label: "Checked In" },
  IN_PROGRESS: { id: 4, label: "In Progress" },

  COMPLETED: { id: 5, label: "Completed" },
  CANCELLED: { id: 6, label: "Cancelled" },
  NO_SHOW: { id: 7, label: "No Show" },
  RESCHEDULED: { id: 8, label: "Rescheduled" },

  PENDING_CONFIRMATION: { id: 9, label: "Pending Confirmation" },
  AWAITING_PAYMENT: { id: 10, label: "Awaiting Payment" },
  FOLLOW_UP_REQUIRED: { id: 11, label: "Follow-up Required" },
  BLOCKED: { id: 12, label: "Blocked" },
} as const;

/** Numeric union: 1 | 2 | ... | 12 */
export type AppointmentStatusId =
  typeof APPOINTMENT_STATUSES[keyof typeof APPOINTMENT_STATUSES]["id"];

/** Helper array (filters, dropdowns, chips) */
export const APPOINTMENT_STATUS_OPTIONS = Object.values(
  APPOINTMENT_STATUSES
);
