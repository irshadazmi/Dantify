import type { BookingAvailableSlot } from '@/services/booking-service';

export type BookingScheduleValue = {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes: number;
};

export type BookingDateStripProps = {
  value: string;
  onChange: (date: string) => void;
  minDate?: string;
  maxDate?: string;
  daysToShow?: number;
};

export type BookingCalendarProps = {
  value: string;
  onChange: (date: string) => void;
  minDate?: string;
  maxDate?: string;
};

export type BookingTimeSlotsProps = {
  slots: BookingAvailableSlot[];
  value?: string | null;
  onChange: (slot: BookingAvailableSlot) => void;
  loading?: boolean;
  error?: string;
};
