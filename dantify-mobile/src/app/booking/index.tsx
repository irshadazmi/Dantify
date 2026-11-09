import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { AppText } from '@/components/ui/app-text';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useAppColors } from '@/hooks/use-app-colors';
import { useAuth } from '@/contexts/auth-context';
import { bookingService } from '@/services/booking-service';
import type { Booking } from '@/types/booking';
import { useStyles } from '@/styles/styles';
import {
  parseBookingLocalDate,
  formatBookingDate as formatLocalBookingDate,
  formatBookingTime as formatLocalBookingTime,
} from '@/utils/booking-date';

type FilterKey = 'upcoming' | 'past' | 'cancelled';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
  { key: 'cancelled', label: 'Cancelled' },
];

function getRoleName(role: unknown): string {
  if (typeof role === 'string') return role.trim().toLowerCase();

  if (role && typeof role === 'object' && 'name' in role) {
    return String((role as { name?: unknown }).name ?? '').trim().toLowerCase();
  }

  return '';
}

function statusCode(booking: Booking): string {
  return String(
    booking.booking_status?.code ?? booking.booking_status?.name ?? '',
  )
    .trim()
    .toLowerCase()
    .replace(/[\\s-]+/g, '_');
}

function isCancelled(booking: Booking): boolean {
  return ['cancelled', 'canceled'].includes(statusCode(booking));
}

function isCompleted(booking: Booking): boolean {
  return ['completed', 'complete', 'no_show', 'rescheduled'].includes(
    statusCode(booking),
  );
}

function isUpcoming(booking: Booking): boolean {
  if (isCancelled(booking) || isCompleted(booking) || !booking.booking_date) {
    return false;
  }

  const date = parseBookingLocalDate(booking.booking_date);
  return !!date && date.getTime() >= Date.now();
}

function money(value: number): string {
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function bookingTotal(booking: Booking): number {
  return (booking.booking_services ?? []).reduce(
    (total, line) => total + Number(line.unit_price) * Number(line.quantity),
    0,
  );
}

export default function BookingsIndexScreen() {
  const router = useRouter();
  const colors = useAppColors();
  const styles = useStyles();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const role = getRoleName(user?.role);
  const isOperationalRole = role === 'clinic' || role === 'staff';
  const canAddBooking = role === 'patient' || isOperationalRole;

  const pageTitle = isOperationalRole
    ? 'Our Bookings'
    : role === 'admin' || role === 'superadmin'
      ? 'All Bookings'
      : 'My Bookings';

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<FilterKey>('upcoming');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading || isAuthenticated) return;

    router.replace({
      pathname: '/(auth)/login',
      params: { redirectTo: '/booking' },
    } as never);
  }, [authLoading, isAuthenticated, router]);

  const loadBookings = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    setError('');

    try {
      const response = await bookingService.getAll({ page: 1, per_page: 100 });
      setBookings(response.data ?? []);
    } catch (err) {
      const message =
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message;

      setError(message || 'Unable to load bookings. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) void loadBookings();
    }, [isAuthenticated, loadBookings]),
  );

  const filteredBookings = useMemo(
    () =>
      bookings.filter((booking) => {
        if (filter === 'cancelled') return isCancelled(booking);
        if (filter === 'past') return !isCancelled(booking) && !isUpcoming(booking);
        return isUpcoming(booking);
      }),
    [bookings, filter],
  );

  const counts = useMemo(
    () => ({
      upcoming: bookings.filter(isUpcoming).length,
      past: bookings.filter(
        (booking) => !isCancelled(booking) && !isUpcoming(booking),
      ).length,
      cancelled: bookings.filter(isCancelled).length,
    }),
    [bookings],
  );

  const openBookingSearch = useCallback(() => {
    // Existing patient booking search entry point.
    router.push('/booking/results' as never);
  }, [router]);

  const renderBooking = useCallback(
    ({ item }: { item: Booking }) => {
      const serviceNames = (item.booking_services ?? [])
        .map((line) => line.clinic_service_offering?.dental_service?.name)
        .filter(Boolean);

      const serviceLabel = serviceNames.length
        ? serviceNames.join(', ')
        : 'Dental appointment';

      return (
        <Pressable
          onPress={() =>
            router.push({
              pathname: '/booking/[bookingId]',
              params: { bookingId: String(item.id) },
            } as never)
          }
          style={styles.card}
          accessibilityRole="button"
          accessibilityLabel={`View booking ${item.id}`}
        >
          <View style={styles.cardHeader}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <AppText style={styles.cardTitle} numberOfLines={2}>
                {serviceLabel}
              </AppText>
              <AppText style={styles.metaText}>Booking #{item.id}</AppText>
            </View>

            <View
              style={[
                styles.statusPill,
                isCancelled(item)
                  ? styles.statusPillDanger
                  : isCompleted(item)
                    ? styles.statusPillSuccess
                    : styles.statusPillInfo,
              ]}
            >
              <AppText
                style={[
                  styles.statusPillText,
                  isCancelled(item)
                    ? styles.statusPillTextDanger
                    : isCompleted(item)
                      ? styles.statusPillTextSuccess
                      : styles.statusPillTextInfo,
                ]}
              >
                {item.booking_status?.name ?? 'Status unavailable'}
              </AppText>
            </View>
          </View>

          {role !== 'patient' && (
            <View style={styles.metaRow}>
              <AppText style={styles.metaText}>Patient:</AppText>
              <AppText style={{ flex: 1, color: colors.text, fontSize: 12 }} numberOfLines={1}>
                {item.patient?.name ?? 'Patient'}
              </AppText>
            </View>
          )}

          {role !== 'dentist' && (
            <View style={styles.metaRow}>
              <AppText style={styles.metaText}>Dentist:</AppText>
              <AppText style={{ flex: 1, color: colors.text, fontSize: 12 }} numberOfLines={1}>
                {item.dentist?.name ?? 'Dentist'}
              </AppText>
            </View>
          )}

          <View style={styles.metaRow}>
            <AppText style={styles.metaText}>Clinic:</AppText>
            <AppText style={{ flex: 1, color: colors.text, fontSize: 12 }} numberOfLines={1}>
              {item.clinic?.name ?? 'Clinic'}
            </AppText>
          </View>

          <View style={styles.metaRow}>
            <AppText style={styles.metaText}>Date:</AppText>
            <AppText style={{ color: colors.text, fontSize: 12 }}>
              {formatLocalBookingDate(item.booking_date)}
            </AppText>
          </View>

          <View style={styles.metaRow}>
            <AppText style={styles.metaText}>Time:</AppText>
            <AppText style={{ color: colors.text, fontSize: 12 }}>
              {formatLocalBookingTime(item.booking_date) || 'Not available'}
            </AppText>
            <View style={{ flex: 1 }} />
            <AppText style={{ color: colors.primary, fontSize: 13, fontWeight: '700' }}>
              {money(bookingTotal(item))}
            </AppText>
          </View>

          <View style={{ alignItems: 'flex-end', marginTop: 10 }}>
            <AppText style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>
              View Details →
            </AppText>
          </View>
        </Pressable>
      );
    },
    [colors.primary, colors.text, role, router, styles],
  );

  if (authLoading || !isAuthenticated) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <AppText style={{ color: colors.textSecondary, marginTop: 10 }}>
          Opening bookings...
        </AppText>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderBooking}
        contentContainerStyle={{ padding: 14, paddingBottom: 28, flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadBookings(true)}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View>
            <ScreenHeader
              title={pageTitle}
              subtitle={
                isOperationalRole
                  ? 'Manage appointments for your clinic.'
                  : 'Keep track of your dental appointments.'
              }
              actionTitle={
                canAddBooking
                  ? role === 'patient'
                    ? '+ Book Appointment'
                    : '+ Add Booking'
                  : undefined
              }
              onAction={canAddBooking ? openBookingSearch : undefined}
            />

            <View style={[styles.headerRow, { gap: 8, marginBottom: 14 }]}>
              {FILTERS.map(({ key, label }) => {
                const selected = filter === key;

                return (
                  <Pressable
                    key={key}
                    onPress={() => setFilter(key)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={[
                      styles.chip,
                      { flex: 1, marginRight: 0, marginBottom: 0 },
                      selected && styles.chipSelected,
                    ]}
                  >
                    <AppText
                      style={[
                        styles.chipText,
                        selected && styles.chipTextSelected,
                      ]}
                    >
                      {label} ({counts[key]})
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={[styles.emptyState, { paddingVertical: 50 }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <AppText style={[styles.metaText, { marginTop: 10 }]}>
                Loading bookings...
              </AppText>
            </View>
          ) : (
            <View style={[styles.emptyState, { paddingVertical: 42 }]}>
              <AppText style={styles.cardTitle}>
                {error ? 'Unable to load bookings' : 'No bookings found'}
              </AppText>
              <AppText
                style={[
                  styles.metaText,
                  { textAlign: 'center', marginTop: 7 },
                ]}
              >
                {error || `There are no ${filter} bookings to display.`}
              </AppText>

              {!!error && (
                <Pressable
                  onPress={() => void loadBookings()}
                  style={{ marginTop: 14 }}
                  accessibilityRole="button"
                >
                  <AppText style={{ color: colors.primary, fontWeight: '700' }}>
                    Try again
                  </AppText>
                </Pressable>
              )}
            </View>
          )
        }
      />
    </View>
  );
}
