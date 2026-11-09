import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { showAppDialog } from '@/components/ui/app-dialog';
import { AppButton } from '@/components/ui/app-button';
import { AppText } from '@/components/ui/app-text';
import BookingScheduleSelector from '@/components/booking/booking-schedule-selector';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useAppColors } from '@/hooks/use-app-colors';
import { bookingService } from '@/services/booking-service';
import type {
  Booking,
  BookingChangeRequestType,
  BookingServicePayload,
} from '@/types/booking';
import type { BookingScheduleValue } from '@/types/booking-schedule';
import { toBookingDate } from '@/utils/booking-schedule';

const first = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] ?? '' : value ?? '';

const formatRequestedBookingDate = (value: BookingScheduleValue) =>
  `${value.date} ${value.startTime}:00`;

export default function BookingChangeRequestScreen() {
  const colors = useAppColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ bookingId?: string | string[] }>();
  const bookingId = Number(first(params.bookingId));

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loadingBooking, setLoadingBooking] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [requestType, setRequestType] = useState<BookingChangeRequestType>('CANCELLATION');
  const [reason, setReason] = useState('');
  const [schedule, setSchedule] = useState<BookingScheduleValue | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadBooking = useCallback(async () => {
    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      setLoadError('The booking reference is invalid.');
      setLoadingBooking(false);
      return;
    }

    try {
      setLoadingBooking(true);
      setLoadError('');
      const response = await bookingService.getById(bookingId);
      setBooking(response.data ?? null);
      if (!response.data) setLoadError('Booking details could not be found.');
    } catch (error) {
      const message =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setLoadError(message || 'Unable to load booking details. Please try again.');
    } finally {
      setLoadingBooking(false);
    }
  }, [bookingId]);

  useEffect(() => { void loadBooking(); }, [loadBooking]);

  const services = useMemo<BookingServicePayload[]>(() =>
    (booking?.booking_services ?? [])
      .filter((item) => Number(item.clinic_service_offering_id) > 0)
      .map((item) => ({
        clinic_service_offering_id: Number(item.clinic_service_offering_id),
        quantity: Math.max(1, Number(item.quantity) || 1),
      })),
  [booking?.booking_services]);

  const submit = async () => {
    if (!booking) {
      showAppDialog('Booking unavailable', 'Booking details are not available. Please reload and try again.');
      return;
    }
    if (!reason.trim()) {
      showAppDialog('Reason required', 'Please enter a reason for your request.');
      return;
    }
    if (requestType === 'RESCHEDULE') {
      if (!schedule) {
        showAppDialog('Select a booking slot', 'Please select an available date and time for the new booking.');
        return;
      }
      if (!booking.dentist_id || !booking.clinic_id || services.length === 0) {
        showAppDialog(
          'Booking details incomplete',
          'The dentist, clinic or original booking services are missing. The rescheduling calendar cannot be loaded.',
        );
        return;
      }
    }

    try {
      setSubmitting(true);

      if (requestType === 'RESCHEDULE' && schedule) {
        // Recheck the selected slot immediately before submitting. Excluding this
        // booking prevents its current slot from conflicting with itself.
        const slotCheck = await bookingService.checkSlot({
          dentist_id: booking.dentist_id,
          clinic_id: booking.clinic_id,
          date: schedule.date,
          start_time: schedule.startTime,
          services,
          exclude_booking_id: bookingId,
        });

        if (!slotCheck.data?.available) {
          setSchedule(null);
          showAppDialog(
            'Booking slot no longer available',
            'This time is no longer available. Please select another available slot.',
          );
          return;
        }
      }

      await bookingService.createChangeRequest(bookingId, {
        request_type: requestType,
        reason: reason.trim(),
        ...(requestType === 'RESCHEDULE' && schedule
          ? { requested_booking_date: formatRequestedBookingDate(schedule) }
          : {}),
      });

      showAppDialog(
        'Request submitted',
        'Your request has been sent to the clinic for review. Your existing booking remains unchanged until the clinic approves it.',
        [{
          text: 'OK',
          onPress: () => router.replace({
            pathname: '/booking/[bookingId]',
            params: { bookingId: String(bookingId) },
          } as never),
        }],
      );
    } catch (error) {
      const message =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response?.data?.message
          : undefined;
      showAppDialog('Unable to submit request', message || 'Please check your details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const fieldStyle = {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: colors.text,
    backgroundColor: colors.surface,
    marginTop: 7,
    minHeight: 112,
    textAlignVertical: 'top' as const,
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 36 }}
      keyboardShouldPersistTaps="handled"
    >
      <ScreenHeader
        title="Booking Change Request"
        subtitle={`Booking #${bookingId}. Your request will be reviewed by the clinic. Your current booking is not changed unless the clinic approves the request.`}
        showBack
        backTitle="Back to Booking"
        onBack={() => router.back()}
      />

      {loadingBooking ? (
        <View style={{ paddingVertical: 36, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText style={{ color: colors.textMuted, marginTop: 10 }}>Loading booking details...</AppText>
        </View>
      ) : loadError ? (
        <View style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 16, marginTop: 12 }}>
          <AppText style={{ color: colors.danger }}>{loadError}</AppText>
          <View style={{ marginTop: 12 }}>
            <AppButton title="Retry" onPress={() => void loadBooking()} />
          </View>
        </View>
      ) : booking ? (
        <>
          <View style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 15, marginTop: 12 }}>
            <AppText style={{ fontWeight: '800', marginBottom: 10 }}>Request type</AppText>
            {([
              ['CANCELLATION', 'Request cancellation'],
              ['RESCHEDULE', 'Request rescheduling'],
            ] as const).map(([value, label]) => {
              const selected = requestType === value;
              return (
                <Pressable
                  key={value}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  onPress={() => {
                    setRequestType(value);
                    if (value === 'CANCELLATION') setSchedule(null);
                  }}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 11 }}
                >
                  <View style={{ width: 19, height: 19, borderRadius: 10, borderWidth: 2, borderColor: selected ? colors.primary : colors.border, alignItems: 'center', justifyContent: 'center' }}>
                    {selected && <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: colors.primary }} />}
                  </View>
                  <AppText style={{ marginLeft: 10, fontWeight: selected ? '800' : '500' }}>{label}</AppText>
                </Pressable>
              );
            })}
          </View>

          {requestType === 'RESCHEDULE' && (
            <View style={{ marginTop: 14 }}>
              {services.length > 0 && booking.dentist_id > 0 && booking.clinic_id > 0 ? (
                <BookingScheduleSelector
                  dentistId={booking.dentist_id}
                  clinicId={booking.clinic_id}
                  services={services}
                  value={schedule}
                  onChange={setSchedule}
                  minDate={toBookingDate(new Date())}
                  excludeBookingId={bookingId}
                  disabled={submitting}
                />
              ) : (
                <View style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 14 }}>
                  <AppText style={{ color: colors.danger, fontWeight: '700' }}>Unable to show available booking times.</AppText>
                  <AppText style={{ color: colors.textMuted, marginTop: 5, fontSize: 13 }}>
                    The original booking does not include the dentist, clinic and service details required to check availability.
                  </AppText>
                </View>
              )}
              <AppText style={{ color: colors.textMuted, fontSize: 12, marginTop: 8 }}>
                The clinic will review your selected slot. Your existing booking remains active until approval.
              </AppText>
            </View>
          )}

          <View style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 15, marginTop: 14 }}>
            <AppText style={{ fontWeight: '700' }}>Reason</AppText>
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder="Explain why you need this change..."
              placeholderTextColor={colors.textMuted}
              style={fieldStyle}
              multiline
              maxLength={2000}
            />
          </View>

          <View style={{ marginTop: 18 }}>
            <AppButton
              title="Submit Request"
              onPress={() => void submit()}
              loading={submitting}
              disabled={submitting || (requestType === 'RESCHEDULE' && !schedule)}
            />
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}
