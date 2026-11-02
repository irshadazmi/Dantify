import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { useStyles } from '@/styles/styles';
import { useAppColors } from '@/hooks/use-app-colors';

import {
  APPOINTMENT_STATUS_OPTIONS,
  type AppointmentStatusId,
} from '@/constants/CONSTANTS';

/* ======================================================
   TYPES
====================================================== */

export type AppointmentFilter = {
  statuses: AppointmentStatusId[];
  range: 'today' | 'week' | 'month' | 'all';
};

type Props = {
  value: AppointmentFilter;
  onChange: (next: AppointmentFilter) => void;
};

/* ======================================================
   TIME RANGE OPTIONS
====================================================== */

const RANGES: {
  label: string;
  value: AppointmentFilter['range'];
}[] = [
  { label: 'Today', value: 'today' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'All', value: 'all' },
];

/* ======================================================
   COMPONENT
====================================================== */

export default function AppointmentFilterBar({
  value,
  onChange,
}: Props) {
  const styles = useStyles();
  const COLORS = useAppColors();

  /* ======================================================
     HANDLERS
  ====================================================== */

  const toggleStatus = (id: AppointmentStatusId) => {
    const alreadySelected = value.statuses.includes(id);

    onChange({
      ...value,
      statuses: alreadySelected
        ? value.statuses.filter((status) => status !== id)
        : [...value.statuses, id],
    });
  };

  const setRange = (range: AppointmentFilter['range']) => {
    onChange({
      ...value,
      range,
    });
  };

  /* ======================================================
     RENDER
  ====================================================== */

  return (
    <View
      style={{
        paddingTop: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.background,
      }}
    >
      {/* STATUS FILTER */}
      <Text style={styles.sectionLabel}>Status</Text>

      <View
        style={[
          styles.chipsContainer,
          { flexWrap: 'wrap' },
        ]}
      >
        {APPOINTMENT_STATUS_OPTIONS.map((status) => {
          const selected = value.statuses.includes(status.id);

          return (
            <Pressable
              key={status.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => toggleStatus(status.id)}
              style={[
                styles.chip,
                selected && styles.chipSelected,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  selected && styles.chipTextSelected,
                ]}
              >
                {status.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* TIME RANGE */}
      <Text style={styles.sectionLabel}>Time</Text>

      <View
        style={[
          styles.chipsContainer,
          { flexWrap: 'wrap' },
        ]}
      >
        {RANGES.map((range) => {
          const selected = value.range === range.value;

          return (
            <Pressable
              key={range.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setRange(range.value)}
              style={[
                styles.chip,
                selected && styles.chipSelected,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  selected && styles.chipTextSelected,
                ]}
              >
                {range.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}