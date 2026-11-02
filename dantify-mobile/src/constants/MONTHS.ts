
/* src/constants/MONTHS.ts */

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export type MonthName = (typeof MONTHS)[number];

/** Convert a JavaScript month index (0–11) to API month (1–12). */
export const toApiMonth = (monthIndex: number): number => {
  if (!Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    throw new RangeError('Month index must be between 0 and 11.');
  }

  return monthIndex + 1;
};

/** Convert an API month (1–12) to a JavaScript month index (0–11). */
export const fromApiMonth = (month: number): number => {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError('API month must be between 1 and 12.');
  }

  return month - 1;
};
