import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from '@/components/ui/app-text';
import { useAppColors } from '@/hooks/use-app-colors';
import { useStyles } from '@/styles/styles';
import type { BookingAvailableSlot } from '@/services/booking-service';
import type { BookingTimeSlotsProps } from '@/types/booking-schedule';
import {
  formatBookingTimeLabel,
  normalizeBookingTime,
} from '@/utils/booking-schedule';

type SlotGroup = {
  key: 'morning' | 'afternoon' | 'evening';
  title: string;
  slots: BookingAvailableSlot[];
};

function groupSlots(slots: BookingAvailableSlot[]): SlotGroup[] {
  const groups: Record<SlotGroup['key'], BookingAvailableSlot[]> = {
    morning: [],
    afternoon: [],
    evening: [],
  };

  slots
    .filter((slot) => slot.available)
    .slice()
    .sort((a, b) => normalizeBookingTime(a.start_time).localeCompare(normalizeBookingTime(b.start_time)))
    .forEach((slot) => {
      const [hour] = normalizeBookingTime(slot.start_time).split(':').map(Number);
      if (hour < 12) groups.morning.push(slot);
      else if (hour < 17) groups.afternoon.push(slot);
      else groups.evening.push(slot);
    });

  return [
    { key: 'morning', title: 'Morning', slots: groups.morning },
    { key: 'afternoon', title: 'Afternoon', slots: groups.afternoon },
    { key: 'evening', title: 'Evening', slots: groups.evening },
  ];
}

export default function BookingTimeSlots({
  slots,
  value,
  onChange,
  loading = false,
  error = '',
}: BookingTimeSlotsProps) {
  const styles = useStyles();
  const colors = useAppColors();
  const groups = useMemo(() => groupSlots(slots), [slots]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    morning: true,
    afternoon: true,
    evening: true,
  });

  if (loading) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: 22 }}>
        <ActivityIndicator color={colors.primary} />
        <AppText style={{ color: colors.textMuted, marginTop: 8 }}>Loading available booking times…</AppText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ paddingVertical: 14 }}>
        <AppText style={{ color: colors.danger }}>{error}</AppText>
      </View>
    );
  }

  if (slots.filter((slot) => slot.available).length === 0) {
    return (
      <View style={{ paddingVertical: 18, alignItems: 'center' }}>
        <Ionicons name="time-outline" size={26} color={colors.textMuted} />
        <AppText style={{ color: colors.text, fontWeight: '700', marginTop: 8 }}>No available times</AppText>
        <AppText style={{ color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 4 }}>
          Please choose another booking date.
        </AppText>
      </View>
    );
  }

  return (
    <View>
      {groups.filter((group) => group.slots.length > 0).map((group) => {
        const isExpanded = expanded[group.key] !== false;
        return (
          <View key={group.key} style={{ marginTop: 12 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: isExpanded }}
              onPress={() => setExpanded((current) => ({ ...current, [group.key]: !isExpanded }))}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 7 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <AppText style={styles.sectionLabel}>{group.title}</AppText>
                <AppText style={{ color: colors.textMuted, fontSize: 11 }}>({group.slots.length})</AppText>
              </View>
              <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
            </Pressable>

            {isExpanded && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {group.slots.map((slot) => {
                  const slotTime = normalizeBookingTime(slot.start_time);
                  const selected = value === slotTime;
                  return (
                    <Pressable
                      key={`${slot.start_time}-${slot.end_time}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => onChange(slot)}
                      style={{
                        minWidth: '29%',
                        paddingHorizontal: 10,
                        paddingVertical: 10,
                        borderRadius: 9,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: selected ? 2 : 1,
                        borderColor: selected ? colors.primary : colors.border,
                        backgroundColor: selected ? colors.primary : colors.surface,
                      }}
                    >
                      <AppText style={{
                        color: selected ? colors.textInverse : colors.text,
                        fontSize: 12,
                        fontWeight: selected ? '800' : '600',
                      }}>
                        {formatBookingTimeLabel(slot.start_time)}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}
