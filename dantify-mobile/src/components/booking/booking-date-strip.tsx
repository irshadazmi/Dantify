import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from '@/components/ui/app-text';
import { useAppColors } from '@/hooks/use-app-colors';
import { useStyles } from '@/styles/styles';
import type { BookingDateStripProps } from '@/types/booking-schedule';
import {
  addBookingDays,
  formatBookingDateShort,
  formatBookingDay,
  startOfBookingWeek,
  toBookingDate,
} from '@/utils/booking-schedule';

export default function BookingDateStrip({
  value,
  onChange,
  minDate = toBookingDate(new Date()),
  maxDate,
  daysToShow = 7,
}: BookingDateStripProps) {
  const styles = useStyles();
  const colors = useAppColors();
  const selectedDate = useMemo(() => new Date(
    Number(value.slice(0, 4)),
    Number(value.slice(5, 7)) - 1,
    Number(value.slice(8, 10)),
    12,
  ), [value]);
  const [weekStart, setWeekStart] = useState(() => startOfBookingWeek(selectedDate));

  useEffect(() => {
    setWeekStart(startOfBookingWeek(selectedDate));
  }, [selectedDate]);

  const dates = useMemo(
    () => Array.from({ length: Math.max(1, Math.min(daysToShow, 14)) }, (_, index) =>
      toBookingDate(addBookingDays(weekStart, index))),
    [daysToShow, weekStart],
  );

  const previousWeekStart = addBookingDays(weekStart, -7);
  const previousWeekLastDate = addBookingDays(previousWeekStart, daysToShow - 1);
  const canGoBack = toBookingDate(previousWeekLastDate) >= minDate;
  const canGoForward = !maxDate || toBookingDate(addBookingDays(weekStart, daysToShow)) <= maxDate;

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous week"
          disabled={!canGoBack}
          onPress={() => setWeekStart((current) => addBookingDays(current, -7))}
          hitSlop={8}
          style={{ padding: 6, opacity: canGoBack ? 1 : 0.3 }}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <AppText style={styles.sectionLabel}>Choose a booking date</AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next week"
          disabled={!canGoForward}
          onPress={() => setWeekStart((current) => addBookingDays(current, 7))}
          hitSlop={8}
          style={{ padding: 6, opacity: canGoForward ? 1 : 0.3 }}
        >
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', gap: 5 }}>
        {dates.map((date) => {
          const selected = date === value;
          const disabled = !(
            date >= minDate && (!maxDate || date <= maxDate)
          );
          return (
            <Pressable
              key={date}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled }}
              disabled={disabled}
              onPress={() => onChange(date)}
              style={{
                flex: 1,
                minWidth: 0,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 9,
                paddingHorizontal: 2,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: selected ? colors.primary : colors.border,
                backgroundColor: selected ? colors.primary : colors.surface,
                opacity: disabled ? 0.35 : 1,
              }}
            >
              <AppText style={{ fontSize: 10, color: selected ? colors.textInverse : colors.textMuted }}>
                {formatBookingDay(date)}
              </AppText>
              <AppText style={{ fontSize: 15, fontWeight: '800', marginTop: 4, color: selected ? colors.textInverse : colors.text }}>
                {formatBookingDateShort(date).split(' ')[0]}
              </AppText>
              <AppText style={{ fontSize: 9, marginTop: 2, color: selected ? colors.textInverse : colors.textMuted }}>
                {formatBookingDateShort(date).split(' ')[1]}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
