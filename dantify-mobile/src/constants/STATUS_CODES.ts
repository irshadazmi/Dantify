
/* src/constants/STATUS_CODES.ts */

/** Statuses used by the feedback workflow. */
export enum StatusCode {
  OPEN = 'Open',
  IN_PROGRESS = 'In Progress',
  RESOLVED = 'Resolved',
  CLOSED = 'Closed',
}

export const FEEDBACK_STATUS_OPTIONS = Object.values(StatusCode);
