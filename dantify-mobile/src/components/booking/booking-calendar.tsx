import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from '@/components/ui/app-text';
import { useAppColors } from '@/hooks/use-app-colors';
import { useStyles } from '@/styles/styles';
import type { BookingCalendarProps } from '@/types/booking-schedule';
import {
  addBookingDays,
  formatBookingMonth,
  isBookingDateInRange,
  toBookingDate,
} from '@/utils/booking-schedule';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function BookingCalendar({
  value,
  onChange,
  minDate = toBookingDate(new Date()),
  maxDate,
}: BookingCalendarProps) {
  const styles = useStyles();
  const colors = useAppColors();
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const date = new Date(`${value}T12:00:00`);
    return new Date(date.getFullYear(), date.getMonth(), 1, 12);
  });

  const cells = useMemo(() => {
    const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1, 12);
    const mondayOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
    const totalCells = Math.ceil((mondayOffset + daysInMonth) / 7) * 7;

    return Array.from({ length: totalCells }, (_, index) => {
      const dayNumber = index - mondayOffset + 1;
      if (dayNumber < 1 || dayNumber > daysInMonth) return null;
      return toBookingDate(new Date(
        visibleMonth.getFullYear(),
        visibleMonth.getMonth(),
        dayNumber,
        12,
      ));
    });
  }, [visibleMonth]);

  const changeMonth = (offset: number) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1, 12));
  };

  const previousMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1, 12);
  const nextMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1, 12);
  const previousAllowed = toBookingDate(new Date(previousMonth.getFullYear(), previousMonth.getMonth() + 1, 0, 12)) >= minDate;
  const nextAllowed = !maxDate || toBookingDate(nextMonth) <= maxDate;

  return (
    <View style={[styles.card, { borderWidth: 1, borderColor: colors.border, padding: 12 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          disabled={!previousAllowed}
          onPress={() => changeMonth(-1)}
          style={{ padding: 6, opacity: previousAllowed ? 1 : 0.3 }}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <AppText style={{ color: colors.text, fontWeight: '700' }}>{formatBookingMonth(visibleMonth)}</AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next month"
          disabled={!nextAllowed}
          onPress={() => changeMonth(1)}
          style={{ padding: 6, opacity: nextAllowed ? 1 : 0.3 }}
        >
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', marginBottom: 5 }}>
        {WEEKDAYS.map((day, index) => (
          <View key={`${day}-${index}`} style={{ flex: 1, alignItems: 'center', paddingVertical: 5 }}>
            <AppText style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700' }}>{day}</AppText>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((date, index) => {
          if (!date) {
            return <View key={`empty-${index}`} style={{ width: '14.2857%', height: 42 }} />;
          }
          const selected = date === value;
          const enabled = isBookingDateInRange(date, minDate, maxDate);
          return (
            <Pressable
              key={date}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled: !enabled }}
              disabled={!enabled}
              onPress={() => onChange(date)}
              style={{
                width: '14.2857%',
                height: 42,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: enabled ? 1 : 0.28,
              }}
            >
              <View style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: selected ? colors.primary : 'transparent',
                borderWidth: selected ? 0 : 1,
                borderColor: selected ? colors.primary : 'transparent',
              }}>
                <AppText style={{
                  color: selected ? colors.textInverse : colors.text,
                  fontSize: 13,
                  fontWeight: selected ? '800' : '500',
                }}>
                  {Number(date.slice(8, 10))}
                </AppText>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
