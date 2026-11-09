import { useCallback, useEffect, useRef, useState } from 'react';

import { bookingService, type BookingAvailableSlot } from '@/services/booking-service';
import type { BookingServicePayload } from '@/types/booking';

type Params = {
  dentistId: number;
  clinicId: number;
  date: string;
  services: BookingServicePayload[];
  enabled?: boolean;
  excludeBookingId?: number;
};

export function useBookingAvailability({
  dentistId,
  clinicId,
  date,
  services,
  enabled = true,
  excludeBookingId,
}: Params) {
  const [slots, setSlots] = useState<BookingAvailableSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  const serviceKey = services
    .map((item) => `${item.clinic_service_offering_id}:${item.quantity ?? 1}`)
    .sort()
    .join('|');

  const reload = useCallback(async () => {
    const id = ++requestId.current;

    if (!enabled || !dentistId || !clinicId || !date || !services.length) {
      setSlots([]);
      setError('');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await bookingService.getAvailability({
        dentist_id: dentistId,
        clinic_id: clinicId,
        date,
        services,
        exclude_booking_id: excludeBookingId,
      });
      if (id !== requestId.current) return;
      setSlots((response.data.slots ?? []).filter((slot) => slot.available));
    } catch (err) {
      if (id !== requestId.current) return;
      setSlots([]);
      const message =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(message || 'Unable to load available booking times. Please try again.');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  // serviceKey intentionally represents the service payload, avoiding array identity loops.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dentistId, clinicId, date, enabled, serviceKey, excludeBookingId]);

  useEffect(() => {
    void reload();
    return () => {
      requestId.current += 1;
    };
  }, [reload]);

  return { slots, loading, error, reload };
}
