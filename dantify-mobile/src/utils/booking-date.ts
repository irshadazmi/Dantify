/**
 * Parse a database/Laravel booking datetime as a clinic-local wall-clock value.
 * MySQL DATETIME has no timezone. Laravel can serialize it with a trailing Z
 * even when the stored value represents clinic-local time. Strip timezone
 * suffixes and construct a local Date to prevent unintended hour shifts.
 */
export function parseBookingLocalDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const normalized = value.trim().replace(' ', 'T');
  const match = normalized.match(
    /^(\\d{4})-(\\d{2})-(\\d{2})T(\\d{2}):(\\d{2})(?::(\\d{2}))?(?:\\.\\d+)?(?:Z|[+-]\\d{2}:?\\d{2})?$/i,
  );
  if (match) {
    const [, year, month, day, hour, minute, second = '0'] = match;
    const parsed = new Date(
      Number(year), Number(month) - 1, Number(day),
      Number(hour), Number(minute), Number(second),
    );
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const fallback = new Date(value);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

export function formatBookingDateTime(value: string | null | undefined): string {
  const parsed = parseBookingLocalDate(value);
  if (!parsed) return value || 'Not available';
  return parsed.toLocaleString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

export function formatBookingDate(value: string | null | undefined): string {
  const parsed = parseBookingLocalDate(value);
  if (!parsed) return value || 'Date not available';
  return parsed.toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

export function formatBookingTime(value: string | null | undefined): string {
  const parsed = parseBookingLocalDate(value);
  if (!parsed) return '';
  return parsed.toLocaleTimeString('en-IN', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}
