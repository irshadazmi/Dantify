import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from '@/components/ui/app-text';
import BookingCalendar from '@/components/booking/booking-calendar';
import BookingDateStrip from '@/components/booking/booking-date-strip';
import BookingTimeSlots from '@/components/booking/booking-time-slots';
import { useBookingAvailability } from '@/hooks/use-booking-availability';
import { useAppColors } from '@/hooks/use-app-colors';
import { useStyles } from '@/styles/styles';
import type { BookingServicePayload } from '@/types/booking';
import type { BookingScheduleValue } from '@/types/booking-schedule';
import { formatBookingLongDate, normalizeBookingTime, toBookingDate } from '@/utils/booking-schedule';

type Props = {
  dentistId: number;
  clinicId: number;
  services: BookingServicePayload[];
  value: BookingScheduleValue | null;
  onChange: (value: BookingScheduleValue | null) => void;
  minDate?: string;
  maxDate?: string;
  disabled?: boolean;
};

export default function BookingScheduleSelector({
  dentistId,
  clinicId,
  services,
  value,
  onChange,
  minDate = toBookingDate(new Date()),
  maxDate,
  disabled = false,
}: Props) {
  const styles = useStyles();
  const colors = useAppColors();
  const [date, setDate] = useState(value?.date ?? minDate);
  const [calendarVisible, setCalendarVisible] = useState(false);

  useEffect(() => {
    if (value?.date && value.date !== date) setDate(value.date);
    // Synchronize only when parent supplies a different selected date.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.date]);

  const availabilityEnabled = dentistId > 0 && clinicId > 0 && services.length > 0 && !disabled;
  const { slots, loading, error, reload } = useBookingAvailability({
    dentistId,
    clinicId,
    date,
    services,
    enabled: availabilityEnabled,
  });

  const selectedSlot = useMemo(
    () => slots.find((slot) => normalizeBookingTime(slot.start_time) === value?.startTime) ?? null,
    [slots, value?.startTime],
  );

  const selectDate = (nextDate: string) => {
    if (nextDate === date) return;
    setDate(nextDate);
    onChange(null);
    setCalendarVisible(false);
  };

  const selectSlot = (slot: typeof slots[number]) => {
    onChange({
      date,
      startTime: normalizeBookingTime(slot.start_time),
      endTime: normalizeBookingTime(slot.end_time),
      durationMinutes: Number(slot.duration_minutes) || 0,
    });
  };

  return (
    <View style={[styles.card, { borderWidth: 1, borderColor: colors.border, padding: 14 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <AppText style={styles.cardTitle}>Select booking date and time</AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={calendarVisible ? 'Close calendar' : 'Open calendar'}
          disabled={disabled}
          onPress={() => setCalendarVisible((visible) => !visible)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 5, opacity: disabled ? 0.5 : 1 }}
        >
          <Ionicons name="calendar-outline" size={17} color={colors.primary} />
          <AppText style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>
            {calendarVisible ? 'Close' : 'Calendar'}
          </AppText>
        </Pressable>
      </View>

      {!availabilityEnabled ? (
        <AppText style={{ color: colors.textMuted, fontSize: 13 }}>
          Select a dentist, clinic and at least one booking service to view available times.
        </AppText>
      ) : (
        <>
          <BookingDateStrip
            value={date}
            onChange={selectDate}
            minDate={minDate}
            maxDate={maxDate}
          />

          {calendarVisible && (
            <View style={{ marginTop: 14 }}>
              <BookingCalendar
                value={date}
                onChange={selectDate}
                minDate={minDate}
                maxDate={maxDate}
              />
            </View>
          )}

          <View style={{ marginTop: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <AppText style={styles.sectionLabel}>Available booking times</AppText>
              <Pressable
                accessibilityRole="button"
                onPress={() => void reload()}
                disabled={loading}
                style={{ padding: 4, opacity: loading ? 0.4 : 1 }}
              >
                <Ionicons name="refresh" size={17} color={colors.primary} />
              </Pressable>
            </View>
            <AppText style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
              {formatBookingLongDate(date)}
            </AppText>
            <BookingTimeSlots
              slots={slots}
              value={selectedSlot ? normalizeBookingTime(selectedSlot.start_time) : null}
              onChange={selectSlot}
              loading={loading}
              error={error}
            />
          </View>

          {value && value.date === date && (
            <View style={{
              marginTop: 14,
              padding: 12,
              borderRadius: 9,
              borderWidth: 1,
              borderColor: colors.primary,
              backgroundColor: colors.surface,
            }}>
              <AppText style={{ color: colors.textMuted, fontSize: 11 }}>SELECTED BOOKING SLOT</AppText>
              <AppText style={{ color: colors.primary, fontWeight: '800', marginTop: 4 }}>
                {formatBookingLongDate(value.date)} · {value.startTime}
              </AppText>
            </View>
          )}
        </>
      )}
    </View>
  );
}
