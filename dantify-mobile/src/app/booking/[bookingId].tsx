import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView, Text, View
} from 'react-native';

import { showAppDialog } from "@/components/ui/app-dialog";
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useAppColors } from '@/hooks/use-app-colors';
import { useAuth } from '@/contexts/auth-context';
import { bookingService } from '@/services/booking-service';
import type {
  Booking, BookingChangeRequest, BookingStatusHistory,
} from '@/types/booking';
import { formatBookingDateTime } from '@/utils/booking-date';

const first = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] ?? '' : value ?? '';

function roleName(role: unknown): string {
  if (typeof role === 'string') return role.toLowerCase();
  if (role && typeof role === 'object' && 'name' in role) {
    return String((role as { name?: unknown }).name ?? '').toLowerCase();
  }
  return '';
}

function statusCode(booking: Booking): string {
  return String(booking.booking_status?.code ?? '').toUpperCase();
}

function dateTime(value: string | null | undefined): string {
  return formatBookingDateTime(value);
}

const TRANSITIONS: Record<string, string[]> = {
  PENDING_CONFIRMATION: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['CHECKED_IN', 'CANCELLED', 'NO_SHOW'],
  CHECKED_IN: ['IN_PROGRESS'],
  IN_PROGRESS: ['COMPLETED'],
};

const LABELS: Record<string, string> = {
  PENDING_CONFIRMATION: 'Pending Confirmation',
  CONFIRMED: 'Confirmed',
  CHECKED_IN: 'Checked In',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No Show',
  RESCHEDULED: 'Rescheduled',
};

function statusColor(code: string, colors: ReturnType<typeof useAppColors>) {
  if (['COMPLETED', 'CONFIRMED'].includes(code)) return colors.success;
  if (['PENDING_CONFIRMATION', 'CHECKED_IN', 'IN_PROGRESS'].includes(code)) return colors.warning;
  if (['CANCELLED', 'NO_SHOW'].includes(code)) return colors.danger;
  return colors.textMuted;
}

export default function BookingDetailsScreen() {
  const colors = useAppColors();
  const router = useRouter();
  const { user } = useAuth();
  const role = roleName(user?.role);
  const params = useLocalSearchParams<{ bookingId?: string | string[] }>();
  const bookingId = Number(first(params.bookingId));

  const [booking, setBooking] = useState<Booking | null>(null);
  const [history, setHistory] = useState<BookingStatusHistory[]>([]);
  const [requests, setRequests] = useState<BookingChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      setError('Invalid booking reference.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const [bookingResult, historyResult, requestResult] = await Promise.all([
        bookingService.getById(bookingId),
        bookingService.getHistory(bookingId),
        bookingService.getChangeRequests(bookingId),
      ]);
      setBooking(bookingResult.data ?? null);
      setHistory(historyResult.data ?? []);
      setRequests(requestResult.data ?? []);
    } catch (err) {
      const message =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(message || 'Unable to load booking details or lifecycle information.');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => { void load(); }, [load]);

  const currentCode = booking ? statusCode(booking) : '';
  const isAdmin = ['admin', 'superadmin'].includes(role);
  const isClinicOperator = ['clinic', 'staff'].includes(role);
  const isDentist = role === 'dentist';
  const isPatient = role === 'patient';

  const allowedActions = useMemo(() => {
    const possible = TRANSITIONS[currentCode] ?? [];
    if (isAdmin) return possible;
    if (isClinicOperator) return possible.filter((code) => [
      'CONFIRMED', 'CHECKED_IN', 'CANCELLED', 'NO_SHOW',
    ].includes(code));
    if (isDentist) return possible.filter((code) => ['IN_PROGRESS', 'COMPLETED'].includes(code));
    return [];
  }, [currentCode, isAdmin, isClinicOperator, isDentist]);

  const pendingRequest = requests.find((request) => request.status === 'PENDING') ?? null;
  const hasPendingRequest = !!pendingRequest;
  const canRequestChange = isPatient
    && ['PENDING_CONFIRMATION', 'CONFIRMED'].includes(currentCode)
    && !hasPendingRequest;

  const card = {
    backgroundColor: colors.surface, borderColor: colors.border,
    borderWidth: 1, borderRadius: 13, padding: 15, marginTop: 13,
  } as const;

  const updateStatus = async (target: string) => {
    showAppDialog(
      'Confirm status change',
      `Change booking #${bookingId} to ${LABELS[target] ?? target}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            try {
              setBusy(true);
              await bookingService.updateStatus(bookingId, {
                status: target,
                remarks: `Status updated to ${LABELS[target] ?? target} from the mobile app.`,
              });
              await load();
            } catch (err) {
              const message =
                typeof err === 'object' && err !== null && 'response' in err
                  ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                  : undefined;
              showAppDialog('Unable to update status', message || 'Please try again.');
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  };

  const reviewRequest = (request: BookingChangeRequest, decision: 'APPROVED' | 'REJECTED') => {
    showAppDialog(
      `${decision === 'APPROVED' ? 'Approve' : 'Reject'} request`,
      `Are you sure you want to ${decision.toLowerCase()} this ${request.request_type.toLowerCase()} request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: decision === 'APPROVED' ? 'Approve' : 'Reject',
          style: decision === 'REJECTED' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              setBusy(true);
              await bookingService.reviewChangeRequest(request.id, {
                decision,
                review_remarks: decision === 'APPROVED'
                  ? 'Approved from the Dantify mobile app.'
                  : 'Rejected from the Dantify mobile app.',
              });
              await load();
              showAppDialog('Request updated', 'The request review has been saved.');
            } catch (err) {
              const message =
                typeof err === 'object' && err !== null && 'response' in err
                  ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                  : undefined;
              showAppDialog('Unable to review request', message || 'Please try again.');
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={{ color: colors.textSecondary, marginTop: 10 }}>Loading booking...</Text>
    </View>;
  }

  if (!booking) {
    return <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Text style={{ color: colors.danger, textAlign: 'center' }}>{error || 'Booking not found.'}</Text>
      <Pressable onPress={() => router.back()} style={{ marginTop: 18 }}>
        <Text style={{ color: colors.primary, fontWeight: '700' }}>Back to Bookings</Text>
      </Pressable>
    </View>;
  }

  const total = (booking.booking_services ?? []).reduce(
    (sum, item) => sum + Number(item.unit_price) * Number(item.quantity), 0,
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 15, paddingBottom: 32 }}>
      <Pressable onPress={() => router.back()} style={{ marginBottom: 8 }}>
        <Text style={{ color: colors.primary, fontWeight: '700' }}>‹ Back to Bookings</Text>
      </Pressable>

      {!!error && <Text style={{ color: colors.danger, marginTop: 8 }}>{error}</Text>}

      <View style={card}>
        <Text style={{ color: colors.textMuted, fontSize: 11 }}>BOOKING REFERENCE</Text>
        <Text style={{ color: colors.primary, fontSize: 25, fontWeight: '800', marginTop: 5 }}>#{booking.id}</Text>
        <View style={{ alignSelf: 'flex-start', marginTop: 10, backgroundColor: colors.background, borderRadius: 18, paddingHorizontal: 11, paddingVertical: 6 }}>
          <Text style={{ color: statusColor(currentCode, colors), fontWeight: '800', fontSize: 12 }}>
            {booking.booking_status?.name ?? LABELS[currentCode] ?? 'Status unavailable'}
          </Text>
        </View>
      </View>

      <View style={card}>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: 8 }}>Booking Details</Text>
        <Detail label="Patient" value={booking.patient?.name ?? '—'} colors={colors} />
        <Detail label="Dentist" value={booking.dentist?.name ?? '—'} colors={colors} />
        <Detail label="Clinic" value={booking.clinic?.name ?? '—'} colors={colors} />
        <Detail label="Date & Time" value={dateTime(booking.booking_date)} colors={colors} last />
      </View>

      <View style={card}>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: 8 }}>Services</Text>
        {(booking.booking_services ?? []).map((line, index) => (
          <Detail key={line.id} label={`${line.clinic_service_offering?.dental_service?.name ?? 'Dental service'} × ${line.quantity}`}
            value={`₹${(Number(line.unit_price) * Number(line.quantity)).toLocaleString('en-IN')}`}
            colors={colors} last={index === (booking.booking_services?.length ?? 0) - 1} />
        ))}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12 }}>
          <Text style={{ color: colors.text, fontWeight: '800' }}>Total</Text>
          <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 18 }}>₹{total.toLocaleString('en-IN')}</Text>
        </View>
      </View>

      {!!booking.notes && <View style={card}>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: 7 }}>Notes</Text>
        <Text style={{ color: colors.textSecondary, lineHeight: 21 }}>{booking.notes}</Text>
      </View>}

      {/* Keep the clinic workflow unambiguous: while a change request is pending,
          show only that request's Approve/Reject actions below. */}
      {!pendingRequest && allowedActions.length > 0 && <View style={card}>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: 10 }}>Booking Actions</Text>
        {allowedActions.map((action) => (
          <Pressable key={action} disabled={busy}
            onPress={() => updateStatus(action)}
            style={{ backgroundColor: action === 'CANCELLED' || action === 'NO_SHOW' ? colors.surface : colors.primary,
              borderWidth: action === 'CANCELLED' || action === 'NO_SHOW' ? 1 : 0,
              borderColor: colors.danger, borderRadius: 9, padding: 13, marginTop: 8, alignItems: 'center', opacity: busy ? 0.6 : 1 }}>
            <Text style={{ color: action === 'CANCELLED' || action === 'NO_SHOW' ? colors.danger : colors.textInverse, fontWeight: '800' }}>
              {busy ? 'Please wait...' : `Mark as ${LABELS[action] ?? action}`}
            </Text>
          </Pressable>
        ))}
      </View>}

      {canRequestChange && <View style={card}>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>Need to change this booking?</Text>
        <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 5, lineHeight: 18 }}>
          Submit one request for this entire booking. All selected services are included automatically.
        </Text>
        <Pressable onPress={() => router.push({
          pathname: '/booking/[bookingId]/change-request',
          params: { bookingId: String(booking.id) },
        } as never)}
          style={{ marginTop: 12, borderRadius: 9, backgroundColor: colors.primary, padding: 13, alignItems: 'center' }}>
          <Text style={{ color: colors.textInverse, fontWeight: '800' }}>Request Cancellation / Reschedule</Text>
        </Pressable>
      </View>}

      {isPatient && hasPendingRequest && <View style={card}>
        <Text style={{ color: colors.warning, fontWeight: '800' }}>A change request is awaiting clinic review.</Text>
      </View>}

      {requests.length > 0 && <View style={card}>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: 10 }}>Change Requests</Text>
        {requests.map((request) => (
          <View key={request.id} style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 8 }}>
            <Text style={{ color: colors.text, fontWeight: '800' }}>
              {request.request_type === 'CANCELLATION' ? 'Cancellation' : 'Rescheduling'} · #{request.id}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>
              {request.reason}
            </Text>
            {!!request.requested_booking_date && <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
              Requested date: {dateTime(request.requested_booking_date)}
            </Text>}
            {request.request_type === 'RESCHEDULE' && (
              <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 4 }}>
                Applies to the entire booking ({booking.booking_services?.length ?? 0} service lines).
              </Text>
            )}
            <Text style={{ color: request.status === 'APPROVED' ? colors.success : request.status === 'REJECTED' ? colors.danger : colors.warning, fontWeight: '800', fontSize: 12, marginTop: 6 }}>
              {request.status}
            </Text>
            {!!request.review_remarks && <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>{request.review_remarks}</Text>}
            {request.status === 'PENDING' && (isClinicOperator || isAdmin) && (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <Pressable disabled={busy} onPress={() => reviewRequest(request, 'APPROVED')}
                  style={{ flex: 1, backgroundColor: colors.primary, padding: 11, borderRadius: 8, alignItems: 'center', opacity: busy ? 0.6 : 1 }}>
                  <Text style={{ color: colors.textInverse, fontWeight: '800' }}>
                    {request.request_type === 'RESCHEDULE' ? 'Approve Reschedule' : 'Approve Cancellation'}
                  </Text>
                </Pressable>
                <Pressable disabled={busy} onPress={() => reviewRequest(request, 'REJECTED')}
                  style={{ flex: 1, borderWidth: 1, borderColor: colors.danger, padding: 11, borderRadius: 8, alignItems: 'center', opacity: busy ? 0.6 : 1 }}>
                  <Text style={{ color: colors.danger, fontWeight: '800' }}>
                    {request.request_type === 'RESCHEDULE' ? 'Reject Reschedule' : 'Reject Cancellation'}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        ))}
      </View>}

      <View style={card}>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: 12 }}>Booking Status History</Text>
        {history.length === 0 ? <Text style={{ color: colors.textMuted }}>No status history available.</Text> :
          history.map((entry, index) => (
            <View key={entry.id} style={{ flexDirection: 'row', gap: 11, paddingBottom: 15 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, marginTop: 5 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '800' }}>
                  {entry.to_status?.name ?? `Status #${entry.to_status_id}`}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 3 }}>
                  {dateTime(entry.created_at)}
                </Text>
                {!!entry.remarks && <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>{entry.remarks}</Text>}
                {entry.changed_by?.name && <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 3 }}>By: {entry.changed_by.name}</Text>}
              </View>
            </View>
          ))}
      </View>

      <Pressable onPress={() => void load()} disabled={busy}
        style={{ marginTop: 15, padding: 13, borderRadius: 9, borderWidth: 1, borderColor: colors.primary, alignItems: 'center' }}>
        <Text style={{ color: colors.primary, fontWeight: '800' }}>Refresh Booking</Text>
      </Pressable>
    </ScrollView>
  );
}

function Detail({ label, value, colors, last = false }: {
  label: string; value: string; colors: ReturnType<typeof useAppColors>; last?: boolean;
}) {
  return <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12,
    paddingVertical: 9, borderBottomWidth: last ? 0 : 1, borderBottomColor: colors.border }}>
    <Text style={{ flex: 0.9, color: colors.textMuted, fontSize: 13 }}>{label}</Text>
    <Text style={{ flex: 1.1, color: colors.text, fontSize: 13, fontWeight: '600', textAlign: 'right' }}>{value}</Text>
  </View>;
}
