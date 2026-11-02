import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { RelativePathString, useRouter } from 'expo-router';

import { useStyles } from '@/styles/styles';
import { useAppColors } from '@/hooks/use-app-colors';
import { useAuth } from '@/contexts/auth-context';

import {
  APPOINTMENT_STATUSES,
  ROLES,
} from '@/constants/CONSTANTS';

import type { AppointmentResponseSchema } from '@/types/appointment-schema';

/* ======================================================
   TYPES
====================================================== */

type Props = {
  appointment?: AppointmentResponseSchema | null;
};

/* ======================================================
   STATUS HELPERS
====================================================== */

type StatusMeta = {
  label: string;
  color: string;
};

function getStatusMeta(
  appointment: AppointmentResponseSchema,
  colors: ReturnType<typeof useAppColors>
): StatusMeta {
  const statusOptions = Object.values(APPOINTMENT_STATUSES) as Array<{
    id: number;
    label: string;
  }>;

  const status = statusOptions.find(
    (item) => item.id === appointment.appointment_status_id
  );

  if (!status) {
    return {
      label: appointment.appointment_status_name ?? 'Unknown',
      color: colors.textMuted,
    };
  }

  switch (status.id) {
    case 1: // Scheduled
    case 2: // Confirmed
    case 3: // Checked In
      return { label: status.label, color: colors.info };

    case 4: // In Progress
      return { label: status.label, color: colors.warning };

    case 5: // Completed
      return { label: status.label, color: colors.success };

    case 6: // Cancelled
    case 7: // No Show
    case 12: // Blocked
      return { label: status.label, color: colors.danger };

    default:
      return { label: status.label, color: colors.warning };
  }
}

/* ======================================================
   DATE HELPERS
====================================================== */

function formatDateTimeRange(
  start?: string | null,
  end?: string | null,
) {
  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : null;

  const validStart =
    startDate && !Number.isNaN(startDate.getTime());

  const validEnd =
    endDate && !Number.isNaN(endDate.getTime());

  const date = validStart
    ? startDate.toLocaleDateString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    : 'Date unavailable';

  const startTime = validStart
    ? startDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
    : 'Start time unavailable';

  const endTime = validEnd
    ? endDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
    : 'End time unavailable';

  return {
    date,
    time: `${startTime} – ${endTime}`,
  };
}

/* ======================================================
   ROLE-BASED DISPLAY
====================================================== */

function getDisplayMeta(
  appointment: AppointmentResponseSchema,
  roleName?: string,
) {
  if (roleName === ROLES.PATIENT) {
    return {
      title: appointment.clinic_name ?? 'Clinic',
      subtitle: appointment.dentist_name
        ? `Dr. ${appointment.dentist_name}`
        : undefined,
      secondary: appointment.clinic_city ?? undefined,
    };
  }

  if (
    roleName === ROLES.CLINIC ||
    roleName === ROLES.DENTIST ||
    roleName === ROLES.STAFF ||
    roleName === ROLES.SUPER_ADMIN
  ) {
    return {
      title: appointment.patient_name ?? 'Patient',
      subtitle: appointment.patient_phone ?? undefined,
      secondary: appointment.patient_email ?? undefined,
    };
  }

  return {
    title: 'Appointment',
    subtitle: undefined,
    secondary: undefined,
  };
}

/* ======================================================
   COMPONENT
====================================================== */

export default function Index({ appointment }: Props) {
  const styles = useStyles();
  const COLORS = useAppColors();
  const router = useRouter();
  const { user } = useAuth();

  const roleName =
    typeof user?.role === 'string'
      ? user.role
      : user?.role?.name;

  if (!appointment || typeof appointment !== 'object') {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Appointment details unavailable
        </Text>
        <Text style={styles.metaText}>
          Refresh the appointment list and try again.
        </Text>
      </View>
    );
  }

  const { date, time } = formatDateTimeRange(
    appointment.start_time,
    appointment.end_time,
  );

  const status = getStatusMeta(appointment, COLORS);

  const meta = getDisplayMeta(appointment, roleName);

  const canModify =
    appointment.appointment_status_id === APPOINTMENT_STATUSES.SCHEDULED.id ||
    appointment.appointment_status_id === APPOINTMENT_STATUSES.CONFIRMED.id;

  return (
    <View style={styles.card}>
      {/* DATE AND STATUS */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{date}</Text>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: status.color },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: '#FFFFFF' },
            ]}
          >
            {status.label}
          </Text>
        </View>
      </View>

      {/* TIME */}
      <Text style={styles.metaText}>{time}</Text>

      {/* PATIENT / CLINIC */}
      <Text
        style={[
          styles.cardTitle,
          { marginTop: 8, marginBottom: 2 },
        ]}
      >
        {meta.title}
      </Text>

      {meta.subtitle ? (
        <Text style={styles.metaText}>
          {meta.subtitle}
        </Text>
      ) : null}

      {meta.secondary ? (
        <Text style={styles.metaText}>
          {meta.secondary}
        </Text>
      ) : null}

      {/* NOTES */}
      {appointment.notes ? (
        <Text
          style={[
            styles.text,
            { marginTop: 6 },
          ]}
          numberOfLines={2}
        >
          {appointment.notes}
        </Text>
      ) : null}

      {/* ACTIONS */}
      <View style={styles.actionsRow}>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.push({
              pathname: '/appointments/[id]' as RelativePathString,
              params: { id: String(appointment.id) },
            })
          }
          style={styles.actionButton}
        >
          <Text
            style={[
              styles.actionButtonText,
              { color: COLORS.info },
            ]}
          >
            Details
          </Text>
        </Pressable>

        {canModify && (
          <>
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: '/appointments/[id]/reschedule' as RelativePathString,
                  params: { id: String(appointment.id) },
                })
              }
              style={styles.actionButton}
            >
              <Text
                style={[
                  styles.actionButtonText,
                  { color: COLORS.warning },
                ]}
              >
                Reschedule
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: '/appointments/[id]/cancel' as RelativePathString,
                  params: { id: String(appointment.id) },
                })
              }
              style={styles.actionButton}
            >
              <Text
                style={[
                  styles.actionButtonText,
                  { color: COLORS.danger },
                ]}
              >
                Cancel
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}