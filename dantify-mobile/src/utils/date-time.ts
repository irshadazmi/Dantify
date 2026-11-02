/**
 * Date/time helpers for the Dantify mobile application.
 * Calendar dates are handled as local date-only values (not UTC instants).
 */

export function getDeviceDateTimeSettings() {
  const settings = Intl.DateTimeFormat().resolvedOptions();

  return {
    locale: settings.locale,
    timeZone: settings.timeZone,
  };
}

/** Parse YYYY-MM-DD as a local calendar date, avoiding UTC date shifts. */
export function parseDateOnly(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);

  if (!match) {
    throw new Error(`Invalid date-only value: ${value}`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new Error(`Invalid calendar date: ${value}`);
  }

  return date;
}

/** Serialize a picked local calendar date as YYYY-MM-DD for the API. */
export function toDateOnly(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/** Format a YYYY-MM-DD calendar date using the device locale. */
export function formatDateOnly(
  value: string | null | undefined,
): string {
  if (!value) return "—";

  const date = parseDateOnly(value);
  const { locale } = getDeviceDateTimeSettings();

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

/** Format an API timestamp that includes Z or an explicit UTC offset. */
export function formatTimestamp(
  value: string | null | undefined,
): string {
  if (!value) return "—";

  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) return "—";

  const { locale, timeZone } = getDeviceDateTimeSettings();

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(timestamp);
}
