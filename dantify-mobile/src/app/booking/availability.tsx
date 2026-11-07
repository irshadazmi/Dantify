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
  type BookingAvailableSlot,
  type PublicClinicServiceOffering,
} from '@/services/booking-service';

type SelectedService = {
  clinic_service_offering_id: number;
  quantity: number;
  name: string;
  price: number;
  duration_minutes: number;
};

const localDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const currency = (value: number) =>
  `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const timeLabel = (value: string) => {
  const [h, m] = value.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const dateLabel = (date: Date) =>
  date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

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
  const [date, setDate] = useState(localDate(new Date()));
  const [slots, setSlots] = useState<BookingAvailableSlot[]>([]);
  const [slot, setSlot] = useState<BookingAvailableSlot | null>(null);
  const [loadingDentist, setLoadingDentist] = useState(true);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
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

  const dates = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 14 }, (_, index) => {
      const next = new Date(today);
      next.setDate(today.getDate() + index);
      return next;
    });
  }, []);

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
      setSlot(null);
      setSlots([]);
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

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!clinicId || !selectedServices.length) {
        setSlots([]);
        setSlot(null);
        return;
      }
      setLoadingSlots(true);
      setSlot(null);
      try {
        const response = await bookingService.getAvailability({
          dentist_id: dentistId,
          clinic_id: clinicId,
          date,
          services: selectedServices.map((item) => ({
            clinic_service_offering_id: item.clinic_service_offering_id,
            quantity: item.quantity,
          })),
        });
        if (active) setSlots((response.data.slots ?? []).filter((item) => item.available));
      } catch (e) {
        console.warn('[BookingAvailability] Slot request failed', e);
        if (active) {
          setSlots([]);
          setError('Unable to retrieve appointment slots. Please try again.');
        }
      } finally {
        if (active) setLoadingSlots(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [clinicId, date, dentistId, selectedServices]);

  const changeQuantity = (id: number, delta: number) => {
    setQuantities((current) => {
      const next = { ...current };
      const quantity = (next[id] ?? 0) + delta;
      if (quantity <= 0) delete next[id];
      else next[id] = Math.min(quantity, 100);
      return next;
    });
    setSlot(null);
  };

  const continueToReview = () => {
    if (!dentist || !selectedClinic || !slot || selectedServices.length === 0) return;
    router.push({
      pathname: '/booking/review',
      params: {
        dentistId: String(dentist.id),
        dentistName: dentist.name,
        clinicId: String(selectedClinic.id),
        clinicName: selectedClinic.name,
        date,
        startTime: slot.start_time,
        endTime: slot.end_time,
        durationMinutes: String(slot.duration_minutes || totalDuration),
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
      <Text style={heading}>Appointment availability</Text>
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

        <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800', marginBottom: 5 }}>Book an Appointment</Text>
        <Text style={[muted, { marginBottom: 16 }]}>Choose a clinic, treatment, date and available time.</Text>

        <View style={card}>
          <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', marginBottom: 5 }}>SELECTED DENTIST</Text>
          <Text style={{ color: colors.text, fontSize: 17, fontWeight: '700' }}>{dentist?.name}</Text>
          <Text style={[muted, { marginTop: 4 }]}>{dentist?.specialization || 'Dental Practitioner'}</Text>
        </View>

        <Text style={heading}>1. Select Clinic</Text>
        {clinics.length === 0 ? <Text style={muted}>No clinic associations are available for this dentist.</Text> :
          clinics.map((clinic) => {
            const selected = clinic.id === clinicId;
            return <Pressable key={clinic.id} onPress={() => { setClinicId(clinic.id); setSlot(null); }} style={[card, { flexDirection: 'row', alignItems: 'center', borderColor: selected ? colors.primary : colors.border, borderWidth: selected ? 2 : 1 }]}>
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

        <Text style={[heading, { marginTop: 10 }]}>3. Select Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 5 }}>
          {dates.map((item) => {
            const value = localDate(item);
            const selected = value === date;
            return <Pressable key={value} onPress={() => { setDate(value); setSlot(null); }} style={{ minWidth: 76, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10, borderWidth: 1, borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary : colors.surface }}>
              <Text style={{ color: selected ? colors.textInverse : colors.text, fontWeight: '700', fontSize: 12 }}>{dateLabel(item)}</Text>
            </Pressable>;
          })}
        </ScrollView>

        <Text style={[heading, { marginTop: 16 }]}>4. Select Available Time</Text>
        {!selectedServices.length ? <Text style={muted}>Select at least one service to check available times.</Text> :
          loadingSlots ? <View style={{ padding: 18 }}><ActivityIndicator color={colors.primary} /><Text style={[muted, { textAlign: 'center', marginTop: 8 }]}>Checking live availability...</Text></View> :
          slots.length === 0 ? <Text style={muted}>No available slots for this date and service selection. Try another date.</Text> :
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
            {slots.map((item, index) => {
              const selected = slot?.start_time === item.start_time;
              return <Pressable key={`${item.start_time}-${index}`} onPress={() => setSlot(item)} style={{ paddingVertical: 11, paddingHorizontal: 14, borderRadius: 9, borderWidth: 1, borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary : colors.surface }}>
                <Text style={{ color: selected ? colors.textInverse : colors.text, fontWeight: '600' }}>{timeLabel(item.start_time)}</Text>
              </Pressable>;
            })}
          </View>}

        {!!error && <Text style={{ color: colors.danger, marginTop: 10 }}>{error}</Text>}

        <Pressable onPress={continueToReview} disabled={!slot || !selectedServices.length} style={{ marginTop: 22, padding: 15, borderRadius: 10, alignItems: 'center', backgroundColor: colors.primary, opacity: slot && selectedServices.length ? 1 : 0.5 }}>
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
