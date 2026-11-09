/** Date-only helpers. These intentionally avoid UTC conversions. */

export function bookingDateToLocalDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new Error(`Invalid booking date: ${value}`);

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
  if (
    date.getFullYear() !== Number(match[1]) ||
    date.getMonth() !== Number(match[2]) - 1 ||
    date.getDate() !== Number(match[3])
  ) {
    throw new Error(`Invalid booking date: ${value}`);
  }
  return date;
}

export function toBookingDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addBookingDays(value: Date, days: number): Date {
  const result = new Date(value.getFullYear(), value.getMonth(), value.getDate(), 12);
  result.setDate(result.getDate() + days);
  return result;
}

export function startOfBookingWeek(value: Date): Date {
  const day = value.getDay(); // Sunday = 0
  return addBookingDays(value, day === 0 ? -6 : 1 - day);
}

export function formatBookingDay(value: string): string {
  return bookingDateToLocalDate(value).toLocaleDateString('en-IN', {
    weekday: 'short',
  });
}

export function formatBookingDateShort(value: string): string {
  return bookingDateToLocalDate(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

export function formatBookingMonth(value: Date): string {
  return value.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export function formatBookingLongDate(value: string): string {
  return bookingDateToLocalDate(value).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function normalizeBookingTime(value: string): string {
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value.trim());
  if (!match) return value;
  return `${match[1].padStart(2, '0')}:${match[2]}`;
}

export function formatBookingTimeLabel(value: string): string {
  const normalized = normalizeBookingTime(value);
  const match = /^(\d{2}):(\d{2})$/.exec(normalized);
  if (!match) return value;
  const date = new Date(2000, 0, 1, Number(match[1]), Number(match[2]));
  return date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function isBookingDateInRange(
  value: string,
  minDate?: string,
  maxDate?: string,
): boolean {
  return (!minDate || value >= minDate) && (!maxDate || value <= maxDate);
}
