import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useAppColors } from '@/hooks/use-app-colors';
import { useAuth } from '@/contexts/auth-context';
import { bookingService } from '@/services/booking-service';
import type { Booking } from '@/types/booking';
import { formatBookingDateTime } from '@/utils/booking-date';

const param = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] ?? '' : value ?? '';

const currency = (value: number) =>
  `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

function formatDateTime(value: string | null) {
  return formatBookingDateTime(value);
}

export default function BookingConfirmationScreen() {
  const router = useRouter();
  const colors = useAppColors();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const params = useLocalSearchParams<{ bookingId?: string | string[] }>();

  const bookingId = Number(param(params.bookingId));
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBooking = useCallback(async () => {
    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      setError('The booking reference is invalid.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const response = await bookingService.getById(bookingId);
      setBooking(response.data ?? null);
      if (!response.data) setError('The booking was created, but its details could not be loaded.');
    } catch (e) {
      const message =
        typeof e === 'object' && e !== null &&
        'response' in e &&
        (e as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(message || 'Your booking was submitted, but we could not retrieve its details.');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) void loadBooking();
  }, [authLoading, isAuthenticated, loadBooking]);

  if (authLoading || !isAuthenticated || loading) {
    return (
      <View style={{
        flex: 1, backgroundColor: colors.background,
        justifyContent: 'center', alignItems: 'center',
      }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 10 }}>
          Loading booking confirmation...
        </Text>
      </View>
    );
  }

  const total = booking?.booking_services?.reduce(
    (sum, line) => sum + Number(line.unit_price) * line.quantity, 0,
  ) ?? 0;

  const card = {
    backgroundColor: colors.surface, borderColor: colors.border,
    borderWidth: 1, borderRadius: 12, padding: 16, marginTop: 14,
  } as const;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
        <View style={{ alignItems: 'center', paddingTop: 16 }}>
          <View style={{
            width: 66, height: 66, borderRadius: 33,
            backgroundColor: colors.primary, alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Text style={{ color: colors.textInverse, fontSize: 34, fontWeight: '800' }}>
              ✓
            </Text>
          </View>
          <Text style={{
            color: colors.text, fontSize: 23, fontWeight: '800',
            marginTop: 15, textAlign: 'center',
          }}>
            {booking ? 'Appointment Booked!' : 'Booking Submitted'}
          </Text>
          <Text style={{
            color: colors.textSecondary, fontSize: 13,
            marginTop: 7, textAlign: 'center', lineHeight: 20,
          }}>
            {booking
              ? 'Your appointment has been successfully created.'
              : 'Your booking was submitted. Please retry loading its details or check My Appointments.'}
          </Text>
        </View>

        {!!error && (
          <View style={card}>
            <Text style={{ color: colors.danger, lineHeight: 20 }}>{error}</Text>
            <Pressable onPress={() => void loadBooking()} style={{ marginTop: 10 }}>
              <Text style={{ color: colors.primary, fontWeight: '700' }}>Retry loading details</Text>
            </Pressable>
          </View>
        )}

        {booking && (
          <>
            <View style={card}>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                BOOKING REFERENCE
              </Text>
              <Text style={{
                color: colors.primary, fontSize: 23, fontWeight: '800',
                marginTop: 5,
              }}>
                #{booking.id}
              </Text>
              <View style={{
                alignSelf: 'flex-start', marginTop: 10, paddingHorizontal: 11,
                paddingVertical: 6, borderRadius: 20,
                backgroundColor: colors.background,
              }}>
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: 12 }}>
                  {booking.booking_status?.name ?? 'Status unavailable'}
                </Text>
              </View>
            </View>

            <View style={card}>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 10 }}>
                Appointment Details
              </Text>
              <Info label="Dentist" value={booking.dentist?.name ?? '—'} colors={colors} />
              <Info label="Clinic" value={booking.clinic?.name ?? '—'} colors={colors} />
              <Info label="Date & Time" value={formatDateTime(booking.booking_date)} colors={colors} last />
            </View>

            <View style={card}>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 8 }}>
                Services & Charges
              </Text>
              {(booking.booking_services ?? []).map((line) => {
                const name = line.clinic_service_offering?.dental_service?.name ?? 'Dental service';
                return (
                  <Info
                    key={line.id}
                    label={`${name} × ${line.quantity}`}
                    value={currency(Number(line.unit_price) * line.quantity)}
                    colors={colors}
                  />
                );
              })}
              <View style={{
                borderTopWidth: 1, borderTopColor: colors.border,
                paddingTop: 12, marginTop: 6, flexDirection: 'row',
                justifyContent: 'space-between',
              }}>
                <Text style={{ color: colors.text, fontWeight: '700' }}>Estimated total</Text>
                <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 18 }}>
                  {currency(total)}
                </Text>
              </View>
            </View>
          </>
        )}

        <Pressable
          onPress={() => router.replace('/booking' as never)}
          style={{
            marginTop: 20, minHeight: 52, borderRadius: 10,
            backgroundColor: colors.primary, alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: colors.textInverse, fontWeight: '800', fontSize: 15 }}>
            View My Appointments
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.replace('/dashboard' as never)}
          style={{
            marginTop: 10, minHeight: 48, borderRadius: 10,
            borderWidth: 1, borderColor: colors.primary,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text style={{ color: colors.primary, fontWeight: '700' }}>
            Go to Home
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Info({
  label, value, colors, last = false,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useAppColors>;
  last?: boolean;
}) {
  return (
    <View style={{
      flexDirection: 'row', justifyContent: 'space-between', gap: 12,
      paddingVertical: 9, borderBottomWidth: last ? 0 : 1,
      borderBottomColor: colors.border,
    }}>
      <Text style={{ flex: 1, color: colors.textMuted, fontSize: 13 }}>{label}</Text>
      <Text style={{
        flex: 1, color: colors.text, fontSize: 13,
        fontWeight: '600', textAlign: 'right',
      }}>
        {value}
      </Text>
    </View>
  );
}
