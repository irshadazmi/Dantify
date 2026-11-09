import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,

  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from 'react-native';

import { showAppDialog } from "@/components/ui/app-dialog";
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useAppColors } from '@/hooks/use-app-colors';
import { useAuth } from '@/contexts/auth-context';
import { bookingService } from '@/services/booking-service';
import patientService from '@/services/patient-service';
import type { BookingCreatePayload } from '@/types/booking';

type SelectedService = {
  clinic_service_offering_id: number;
  quantity: number;
  name: string;
  price: number;
  duration_minutes: number;
};

type RouteParams = {
  dentistId?: string | string[];
  dentistName?: string | string[];
  clinicId?: string | string[];
  clinicName?: string | string[];
  date?: string | string[];
  startTime?: string | string[];
  endTime?: string | string[];
  durationMinutes?: string | string[];
  services?: string | string[];
  estimatedPrice?: string | string[];
};

const param = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] ?? '' : value ?? '';

function parseServices(value: string): SelectedService[] {
  try {
    const data: unknown = JSON.parse(value);
    if (!Array.isArray(data)) return [];
    return data.filter((item): item is SelectedService =>
      !!item &&
      typeof item === 'object' &&
      Number.isInteger(Number((item as SelectedService).clinic_service_offering_id)) &&
      Number((item as SelectedService).clinic_service_offering_id) > 0 &&
      Number((item as SelectedService).quantity) > 0 &&
      typeof (item as SelectedService).name === 'string',
    ).map((item) => ({
      clinic_service_offering_id: Number(item.clinic_service_offering_id),
      quantity: Number(item.quantity),
      name: item.name,
      price: Number(item.price) || 0,
      duration_minutes: Number(item.duration_minutes) || 0,
    }));
  } catch {
    return [];
  }
}

const currency = (value: number) =>
  `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

function formatDate(value: string) {
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      });
}

function formatTime(value: string) {
  const [h, m] = value.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return date.toLocaleTimeString('en-IN', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

function apiErrorMessage(error: unknown) {
  if (typeof error !== 'object' || error === null) {
    return 'Unable to complete your booking. Please try again.';
  }
  const e = error as {
    message?: string;
    response?: {
      status?: number;
      data?: {
        message?: string;
        errors?: Record<string, string | string[]>;
      };
    };
  };
  const errors = e.response?.data?.errors;
  if (errors) {
    const first = Object.values(errors)[0];
    if (first) return Array.isArray(first) ? first[0] : first;
  }
  if (e.response?.status === 409) {
    return 'This appointment slot has just been booked. Please choose another time.';
  }
  return e.response?.data?.message ??
    e.message ??
    'Unable to complete your booking. Please try again.';
}

function roleName(role: unknown): string {
  if (typeof role === 'string') return role.toLowerCase();
  if (role && typeof role === 'object' && 'name' in role) {
    return String((role as { name?: unknown }).name ?? '').toLowerCase();
  }
  return '';
}

export default function BookingReviewScreen() {
  const router = useRouter();
  const colors = useAppColors();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const params = useLocalSearchParams<RouteParams>();

  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [screenError, setScreenError] = useState('');
  const [profileStatus, setProfileStatus] = useState<'checking' | 'ready' | 'redirecting' | 'error'>('checking');
  const [profileCheckAttempt, setProfileCheckAttempt] = useState(0);
  const profileCheckStarted = useRef(false);

  useEffect(() => {
    if (authLoading || isAuthenticated) return;
    router.replace({
      pathname: '/(auth)/login',
      params: {
        ...Object.fromEntries(
          Object.entries(params).map(([key, value]) => [
            key, Array.isArray(value) ? value[0] : value ?? '',
          ]),
        ),
        redirectTo: '/booking/review',
      },
    } as never);
  }, [authLoading, isAuthenticated, params, router]);

  // A patient profile is required before a booking can be submitted.
  // Preserve every booking parameter while redirecting to profile creation.
  useEffect(() => {
    if (authLoading || !isAuthenticated || profileCheckStarted.current) return;

    if (roleName(user?.role) !== 'patient') {
      setProfileStatus('ready');
      profileCheckStarted.current = true;
      return;
    }

    profileCheckStarted.current = true;
    let active = true;

    const checkPatientProfile = async () => {
      try {
        const response = await patientService.getMyProfile();
        if (!active) return;

        if (response?.data) {
          setProfileStatus('ready');
          return;
        }

        // Treat an empty profile response like a missing profile.
        setProfileStatus('redirecting');
        router.replace({
          pathname: '/profiles/patient/create',
          params: {
            ...Object.fromEntries(
              Object.entries(params).map(([key, value]) => [
                key,
                Array.isArray(value) ? value[0] : value ?? '',
              ]),
            ),
            returnTo: '/booking/review',
          },
        } as never);
      } catch (error) {
        if (!active) return;

        const status =
          typeof error === 'object' && error !== null
            ? (error as { response?: { status?: number } }).response?.status
            : undefined;

        if (status === 404) {
          setProfileStatus('redirecting');
          router.replace({
            pathname: '/profiles/patient/create',
            params: {
              ...Object.fromEntries(
                Object.entries(params).map(([key, value]) => [
                  key,
                  Array.isArray(value) ? value[0] : value ?? '',
                ]),
              ),
              returnTo: '/booking/review',
            },
          } as never);
          return;
        }

        setProfileStatus('error');
        setScreenError(apiErrorMessage(error));
      }
    };

    void checkPatientProfile();

    return () => {
      active = false;
    };
  }, [authLoading, isAuthenticated, params, router, user?.role, profileCheckAttempt]);

  const booking = useMemo(() => {
    const services = parseServices(param(params.services));
    return {
      dentistId: Number(param(params.dentistId)),
      dentistName: param(params.dentistName),
      clinicId: Number(param(params.clinicId)),
      clinicName: param(params.clinicName),
      date: param(params.date),
      startTime: param(params.startTime),
      endTime: param(params.endTime),
      durationMinutes: Number(param(params.durationMinutes)),
      services,
      price: services.reduce((sum, item) => sum + item.price * item.quantity, 0),
      duration: services.reduce(
        (sum, item) => sum + item.duration_minutes * item.quantity, 0,
      ),
    };
  }, [params]);

  const valid =
    Number.isInteger(booking.dentistId) && booking.dentistId > 0 &&
    Number.isInteger(booking.clinicId) && booking.clinicId > 0 &&
    !!booking.dentistName && !!booking.clinicName &&
    /^\d{4}-\d{2}-\d{2}$/.test(booking.date) &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(booking.startTime) &&
    booking.services.length > 0;

  const card = {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
    marginTop: 14,
  } as const;
  const title = {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 10,
  };

  const confirmBooking = async () => {
    if (submitting) return;
    if (roleName(user?.role) !== 'patient') {
      showAppDialog(
        'Patient account required',
        'Please sign in with a patient account to book an appointment.',
      );
      return;
    }

    setSubmitting(true);
    setScreenError('');

    try {
      const services = booking.services.map((item) => ({
        clinic_service_offering_id: item.clinic_service_offering_id,
        quantity: item.quantity,
      }));

      // Early revalidation. The POST endpoint performs its own final
      // transactional schedule/conflict validation as well.
      const slotCheck = await bookingService.checkSlot({
        dentist_id: booking.dentistId,
        clinic_id: booking.clinicId,
        date: booking.date,
        start_time: booking.startTime,
        services,
      });

      if (!slotCheck.data?.available) {
        setScreenError(
          slotCheck.message ||
          'This time is no longer available. Please return to availability and select another slot.',
        );
        setSubmitting(false);
        return;
      }

      const payload: BookingCreatePayload = {
        dentist_id: booking.dentistId,
        clinic_id: booking.clinicId,
        booking_date: `${booking.date} ${booking.startTime}:00`,
        notes: notes.trim() || null,
        services,
      };

      const response = await bookingService.create(payload);
      const createdBooking = response.data;

      if (!createdBooking?.id) {
        throw new Error('The server did not return the created booking reference.');
      }

      router.replace({
        pathname: '/booking/confirmation',
        params: { bookingId: String(createdBooking.id) },
      } as never);
    } catch (error) {
      setScreenError(apiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <View style={{
        flex: 1, backgroundColor: colors.background,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 10 }}>
          Checking your account...
        </Text>
      </View>
    );
  }

  if (profileStatus === 'checking' || profileStatus === 'redirecting') {
    return (
      <View style={{
        flex: 1,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 12, textAlign: 'center' }}>
          {profileStatus === 'redirecting'
            ? 'Opening your patient profile...'
            : 'Checking your patient profile...'}
        </Text>
      </View>
    );
  }

  if (profileStatus === 'error') {
    return (
      <View style={{
        flex: 1,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}>
        <Text style={{ color: colors.danger, textAlign: 'center', lineHeight: 21 }}>
          {screenError || 'Unable to verify your patient profile. Please try again.'}
        </Text>
        <Pressable
          onPress={() => {
            profileCheckStarted.current = false;
            setScreenError('');
            setProfileStatus('checking');
            setProfileCheckAttempt((attempt) => attempt + 1);
          }}
          style={{
            marginTop: 18,
            backgroundColor: colors.primary,
            borderRadius: 9,
            paddingHorizontal: 20,
            paddingVertical: 12,
          }}
        >
          <Text style={{ color: colors.textInverse, fontWeight: '700' }}>
            Retry
          </Text>
        </Pressable>
      </View>
    );
  }

  if (!valid) {
    return (
      <View style={{
        flex: 1, backgroundColor: colors.background,
        alignItems: 'center', justifyContent: 'center', padding: 24,
      }}>
        <Text style={{
          color: colors.text, fontSize: 20, fontWeight: '700',
          textAlign: 'center',
        }}>
          Booking details unavailable
        </Text>
        <Text style={{
          color: colors.textSecondary, textAlign: 'center', marginTop: 10,
        }}>
          Some appointment details are missing or invalid. Please return to availability and select your appointment again.
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={{
            backgroundColor: colors.primary, padding: 14,
            borderRadius: 9, marginTop: 20,
          }}
        >
          <Text style={{ color: colors.textInverse, fontWeight: '700' }}>
            Back to availability
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: 14, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} style={{ marginBottom: 12 }}>
          <Text style={{ color: colors.primary, fontWeight: '600' }}>
            ‹ Back to availability
          </Text>
        </Pressable>

        <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>
          Review Your Booking
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 5 }}>
          Check the appointment information before confirming.
        </Text>

        <View style={card}>
          <Text style={title}>Appointment Details</Text>
          <Detail label="Dentist" value={booking.dentistName} colors={colors} />
          <Detail label="Clinic" value={booking.clinicName} colors={colors} />
          <Detail label="Date" value={formatDate(booking.date)} colors={colors} />
          <Detail
            label="Time"
            value={`${formatTime(booking.startTime)}${booking.endTime ? ` – ${formatTime(booking.endTime)}` : ''}`}
            colors={colors}
          />
          <Detail
            label="Duration"
            value={`${booking.durationMinutes || booking.duration} minutes`}
            colors={colors}
            last
          />
        </View>

        <View style={card}>
          <Text style={title}>Selected Services</Text>
          {booking.services.map((service, index) => (
            <View
              key={service.clinic_service_offering_id}
              style={{
                flexDirection: 'row', justifyContent: 'space-between',
                paddingVertical: 10,
                borderBottomWidth: index === booking.services.length - 1 ? 0 : 1,
                borderBottomColor: colors.border, gap: 10,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '600' }}>
                  {service.name}
                </Text>
                <Text style={{
                  color: colors.textMuted, fontSize: 12, marginTop: 4,
                }}>
                  {currency(service.price)} × {service.quantity} · {service.duration_minutes * service.quantity} min
                </Text>
              </View>
              <Text style={{ color: colors.text, fontWeight: '600' }}>
                {currency(service.price * service.quantity)}
              </Text>
            </View>
          ))}
        </View>

        <View style={card}>
          <Text style={title}>Booking Summary</Text>
          <Detail
            label="Total quantity"
            value={String(booking.services.reduce((sum, item) => sum + item.quantity, 0))}
            colors={colors}
          />
          <Detail
            label="Total duration"
            value={`${booking.duration} minutes`}
            colors={colors}
            last
          />
          <View style={{
            borderTopWidth: 1, borderTopColor: colors.border,
            marginTop: 8, paddingTop: 13, flexDirection: 'row',
            justifyContent: 'space-between',
          }}>
            <Text style={{ color: colors.text, fontWeight: '700' }}>
              Estimated total
            </Text>
            <Text style={{
              color: colors.primary, fontSize: 19, fontWeight: '800',
            }}>
              {currency(booking.price)}
            </Text>
          </View>
          <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 9 }}>
            Final charges are based on the clinic's current service prices.
          </Text>
        </View>

        <View style={card}>
          <Text style={title}>Additional Notes (Optional)</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Share any information the clinic should know..."
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={5000}
            textAlignVertical="top"
            style={{
              minHeight: 90, color: colors.text, borderWidth: 1,
              borderColor: colors.border, borderRadius: 9,
              padding: 11, fontSize: 14,
            }}
          />
        </View>

        {!!screenError && (
          <View style={{
            marginTop: 14, padding: 13, borderRadius: 9,
            borderWidth: 1, borderColor: colors.danger,
            backgroundColor: colors.surface,
          }}>
            <Text style={{ color: colors.danger, lineHeight: 20 }}>
              {screenError}
            </Text>
            <Pressable
              onPress={() => router.back()}
              style={{ marginTop: 10 }}
            >
              <Text style={{ color: colors.primary, fontWeight: '700' }}>
                Choose another time
              </Text>
            </Pressable>
          </View>
        )}

        <Pressable
          onPress={confirmBooking}
          disabled={submitting}
          style={{
            marginTop: 18, minHeight: 54, borderRadius: 10,
            backgroundColor: submitting ? colors.textMuted : colors.primary,
            alignItems: 'center', justifyContent: 'center',
            flexDirection: 'row', gap: 9,
          }}
        >
          {submitting && <ActivityIndicator color={colors.textInverse} />}
          <Text style={{
            color: colors.textInverse, fontSize: 16, fontWeight: '800',
          }}>
            {submitting ? 'Confirming Appointment...' : 'Confirm Appointment'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          disabled={submitting}
          style={{
            marginTop: 10, minHeight: 48, borderRadius: 9,
            borderWidth: 1, borderColor: colors.primary,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text style={{ color: colors.primary, fontWeight: '700' }}>
            Change Appointment
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Detail({
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
      paddingVertical: 10, borderBottomWidth: last ? 0 : 1,
      borderBottomColor: colors.border,
    }}>
      <Text style={{ flex: 0.8, color: colors.textMuted, fontSize: 13 }}>
        {label}
      </Text>
      <Text style={{
        flex: 1.2, color: colors.text, fontSize: 13,
        fontWeight: '600', textAlign: 'right',
      }}>
        {value}
      </Text>
    </View>
  );
}
