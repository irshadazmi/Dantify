import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import dentistSearchService, {
  type PublicSearchClinic,
  type PublicSearchDentist,
} from '@/services/dentist-search-service';
import {
  bookingService,
  type PublicClinicServiceOffering,
} from '@/services/booking-service';
import {
  BookingScheduleSelector,
  type BookingScheduleValue,
} from '@/components/booking';

type SelectedService = {
  clinic_service_offering_id: number;
  quantity: number;
  name: string;
  price: number;
  duration_minutes: number;
};


const currency = (value: number) =>
  `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;


const clinicAddress = (clinic: PublicSearchClinic) =>
  [clinic.address, clinic.city, clinic.state, clinic.postal_code]
    .filter(Boolean)
    .join(', ') || 'Clinic address not available';

export default function AvailabilityScreen() {
  const router = useRouter();
  const colors = useAppColors();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const params = useLocalSearchParams<{
    dentistId?: string | string[];
    clinicId?: string | string[];
  }>();

  const dentistId = Number(Array.isArray(params.dentistId) ? params.dentistId[0] : params.dentistId);
  const requestedClinicId = Number(Array.isArray(params.clinicId) ? params.clinicId[0] : params.clinicId);

  useEffect(() => {
    if (authLoading || isAuthenticated) return;
    router.replace({
      pathname: '/(auth)/login',
      params: {
        dentistId: String(dentistId),
        ...(Number.isInteger(requestedClinicId) && requestedClinicId > 0
          ? { clinicId: String(requestedClinicId) }
          : {}),
        redirectTo: '/booking/availability',
      },
    } as never);
  }, [authLoading, isAuthenticated, dentistId, requestedClinicId, router]);

  const [dentist, setDentist] = useState<PublicSearchDentist | null>(null);
  const [clinics, setClinics] = useState<PublicSearchClinic[]>([]);
  const [clinicId, setClinicId] = useState<number | null>(null);
  const [offerings, setOfferings] = useState<PublicClinicServiceOffering[]>([]);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [bookingSchedule, setBookingSchedule] = useState<BookingScheduleValue | null>(null);
  const [loadingDentist, setLoadingDentist] = useState(true);
  const [loadingServices, setLoadingServices] = useState(false);
  const [error, setError] = useState('');

  const selectedClinic = clinics.find((item) => item.id === clinicId) ?? null;
  const selectedServices = useMemo<SelectedService[]>(
    () => offerings
      .filter((item) => (quantities[item.id] ?? 0) > 0)
      .map((item) => ({
        clinic_service_offering_id: item.id,
        quantity: quantities[item.id],
        name: item.dental_service.name,
        price: Number(item.price) || 0,
        duration_minutes: Number(item.duration_minutes) || 0,
      })),
    [offerings, quantities],
  );
  const totalPrice = selectedServices.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalDuration = selectedServices.reduce((sum, item) => sum + item.duration_minutes * item.quantity, 0);


  const loadDentist = useCallback(async () => {
    if (!Number.isInteger(dentistId) || dentistId <= 0) {
      setError('The dentist information is missing or invalid.');
      setLoadingDentist(false);
      return;
    }
    setLoadingDentist(true);
    setError('');
    try {
      const result = await dentistSearchService.getPublicById(dentistId);
      setDentist(result);
      const unique = Array.from(new Map((result.clinics ?? []).map((c) => [c.id, c])).values());
      setClinics(unique);
      const selected = unique.find((c) => c.id === requestedClinicId) ?? unique[0];
      setClinicId(selected?.id ?? null);
    } catch (e) {
      console.warn('[BookingAvailability] Dentist load failed', e);
      setError('Unable to load dentist details. Please try again.');
    } finally {
      setLoadingDentist(false);
    }
  }, [dentistId, requestedClinicId]);

  useEffect(() => { void loadDentist(); }, [loadDentist]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!clinicId) {
        setOfferings([]);
        setQuantities({});
        return;
      }
      setLoadingServices(true);
      setOfferings([]);
      setQuantities({});
      setBookingSchedule(null);
      try {
        const response = await bookingService.getPublicClinicServices(clinicId);
        if (!active) return;
        setOfferings((response.data.data ?? []).filter(
          (item) => item.is_active && item.dental_service?.is_active,
        ));
      } catch (e) {
        console.warn('[BookingAvailability] Clinic services load failed', e);
        if (active) setError('Unable to load services for this clinic. Please try again.');
      } finally {
        if (active) setLoadingServices(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [clinicId]);



  const changeQuantity = (id: number, delta: number) => {
    setQuantities((current) => {
      const next = { ...current };
      const quantity = (next[id] ?? 0) + delta;
      if (quantity <= 0) delete next[id];
      else next[id] = Math.min(quantity, 100);
      return next;
    });
    setBookingSchedule(null);
  };

  const continueToReview = () => {
    if (!dentist || !selectedClinic || !bookingSchedule || selectedServices.length === 0) return;
    router.push({
      pathname: '/booking/review',
      params: {
        dentistId: String(dentist.id),
        dentistName: dentist.name,
        clinicId: String(selectedClinic.id),
        clinicName: selectedClinic.name,
        date: bookingSchedule.date,
        startTime: bookingSchedule.startTime,
        endTime: bookingSchedule.endTime,
        durationMinutes: String(bookingSchedule.durationMinutes || totalDuration),
        services: JSON.stringify(selectedServices),
        estimatedPrice: String(totalPrice),
      },
    } as never);
  };

  const card = {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  } as const;
  const heading = { color: colors.text, fontSize: 16, fontWeight: '700' as const, marginBottom: 8 };
  const muted = { color: colors.textMuted, fontSize: 13, lineHeight: 19 };

  if (authLoading || !isAuthenticated || loadingDentist) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Loading dentist and clinic details...</Text>
    </View>;
  }

  if (error && !dentist) {
    return <View style={{ flex: 1, padding: 20, justifyContent: 'center', backgroundColor: colors.background }}>
      <Text style={heading}>Booking availability</Text>
      <Text style={{ color: colors.danger }}>{error}</Text>
      <Pressable onPress={() => void loadDentist()} style={{ marginTop: 18, backgroundColor: colors.primary, padding: 14, borderRadius: 9 }}>
        <Text style={{ color: colors.textInverse, textAlign: 'center', fontWeight: '700' }}>Retry</Text>
      </Pressable>
    </View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 30 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <Pressable onPress={() => router.back()}><Text style={{ color: colors.primary, fontWeight: '600' }}>‹ Back</Text></Pressable>
          <Pressable onPress={() => router.replace('/booking' as never)}><Text style={{ color: colors.primary, fontWeight: '600' }}>Find dentist</Text></Pressable>
        </View>

        <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800', marginBottom: 5 }}>Create a Booking</Text>
        <Text style={[muted, { marginBottom: 16 }]}>Choose a clinic, services, booking date and available time.</Text>

        <View style={card}>
          <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', marginBottom: 5 }}>SELECTED DENTIST</Text>
          <Text style={{ color: colors.text, fontSize: 17, fontWeight: '700' }}>{dentist?.name}</Text>
          <Text style={[muted, { marginTop: 4 }]}>{dentist?.specialization || 'Dental Practitioner'}</Text>
        </View>

        <Text style={heading}>1. Select Clinic</Text>
        {clinics.length === 0 ? <Text style={muted}>No clinic associations are available for this dentist.</Text> :
          clinics.map((clinic) => {
            const selected = clinic.id === clinicId;
            return <Pressable key={clinic.id} onPress={() => { setClinicId(clinic.id); setBookingSchedule(null); }} style={[card, { flexDirection: 'row', alignItems: 'center', borderColor: selected ? colors.primary : colors.border, borderWidth: selected ? 2 : 1 }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '700' }}>{clinic.name}</Text>
                <Text style={[muted, { marginTop: 4 }]}>{clinicAddress(clinic)}</Text>
                {!!clinic.phone && <Text style={[muted, { marginTop: 3 }]}>{clinic.phone}</Text>}
              </View>
              <Text style={{ color: colors.primary, fontSize: 20, marginLeft: 8 }}>{selected ? '●' : '○'}</Text>
            </Pressable>;
          })}

        <Text style={[heading, { marginTop: 10 }]}>2. Select Services</Text>
        {loadingServices ? <ActivityIndicator color={colors.primary} /> :
          offerings.length === 0 ? <Text style={muted}>Select a clinic to see its active services. No active services may be available.</Text> :
          offerings.map((offering) => {
            const quantity = quantities[offering.id] ?? 0;
            const selected = quantity > 0;
            return <View key={offering.id} style={[card, { borderColor: selected ? colors.primary : colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <Pressable onPress={() => changeQuantity(offering.id, selected ? -quantity : 1)} style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={{ color: colors.text, fontWeight: '700' }}>{selected ? '☑ ' : '□ '}{offering.dental_service.name}</Text>
                  {!!offering.dental_service.description && <Text style={[muted, { marginTop: 4 }]}>{offering.dental_service.description}</Text>}
                  <Text style={[muted, { marginTop: 5 }]}>{offering.duration_minutes} minutes</Text>
                </Pressable>
                <Text style={{ color: colors.primary, fontWeight: '700' }}>{currency(Number(offering.price))}</Text>
              </View>
              {selected && <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 16, marginTop: 12 }}>
                <Text style={muted}>Quantity</Text>
                <Pressable onPress={() => changeQuantity(offering.id, -1)} disabled={quantity <= 1} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: colors.background }}><Text style={{ color: colors.primary, fontWeight: '700' }}>−</Text></Pressable>
                <Text style={{ color: colors.text, fontWeight: '700' }}>{quantity}</Text>
                <Pressable onPress={() => changeQuantity(offering.id, 1)} disabled={quantity >= 100} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: colors.background }}><Text style={{ color: colors.primary, fontWeight: '700' }}>+</Text></Pressable>
                <Text style={{ color: colors.text, fontWeight: '700' }}>{currency(Number(offering.price) * quantity)}</Text>
              </View>}
            </View>;
          })}

        {selectedServices.length > 0 && <View style={[card, { marginTop: 4 }]}>
          <Text style={heading}>Selected Services Summary</Text>
          <SummaryRow label="Selected services" value={String(selectedServices.length)} colors={colors} />
          <SummaryRow label="Total quantity" value={String(selectedServices.reduce((sum, item) => sum + item.quantity, 0))} colors={colors} />
          <SummaryRow label="Estimated duration" value={`${totalDuration} minutes`} colors={colors} />
          <SummaryRow label="Estimated total" value={currency(totalPrice)} colors={colors} strong />
        </View>}

        <Text style={[heading, { marginTop: 10 }]}>3. Select Booking Date and Time</Text>
        <BookingScheduleSelector
          dentistId={dentistId}
          clinicId={clinicId ?? 0}
          services={selectedServices.map((item) => ({
            clinic_service_offering_id: item.clinic_service_offering_id,
            quantity: item.quantity,
          }))}
          value={bookingSchedule}
          onChange={setBookingSchedule}
        />

        {!!error && <Text style={{ color: colors.danger, marginTop: 10 }}>{error}</Text>}

        <Pressable onPress={continueToReview} disabled={!bookingSchedule || !selectedServices.length} style={{ marginTop: 22, padding: 15, borderRadius: 10, alignItems: 'center', backgroundColor: colors.primary, opacity: bookingSchedule && selectedServices.length ? 1 : 0.5 }}>
          <Text style={{ color: colors.textInverse, fontWeight: '700', fontSize: 15 }}>Continue to Review</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function SummaryRow({ label, value, colors, strong = false }: {
  label: string; value: string; colors: ReturnType<typeof useAppColors>; strong?: boolean;
}) {
  return <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 }}>
    <Text style={{ color: colors.textMuted, fontSize: 13 }}>{label}</Text>
    <Text style={{ color: strong ? colors.primary : colors.text, fontWeight: strong ? '800' : '600' }}>{value}</Text>
  </View>;
}
