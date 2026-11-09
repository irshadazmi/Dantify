import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,

  FlatList,
  Pressable,
  RefreshControl,
  View
} from 'react-native';

import { showAppDialog } from "@/components/ui/app-dialog";
import { useRouter } from 'expo-router';

import { useAuth } from '@/contexts/auth-context';
import { useStyles } from '@/styles/styles';
import { useAppColors } from '@/hooks/use-app-colors';

import { AppText } from '@/components/ui/app-text';
import { AppInput } from '@/components/ui/app-input';
import { ScreenHeader } from '@/components/ui/screen-header';
import { StatusBadge } from '@/components/ui/status-badge';

import {
  getClinicServiceOfferings,
  updateClinicServiceOfferingStatus,
} from '@/services/clinic-service-offering-service';

import type { ClinicServiceOffering } from '@/types/clinic-service-offering';

function getRoleName(
  role: string | { name: string } | undefined,
): string | undefined {
  return typeof role === 'string' ? role.toLowerCase() : role?.name?.toLowerCase();
}

function getErrorMessage(error: unknown): string {
  const err = error as {
    response?: {
      data?: {
        message?: string;
        errors?: Record<string, string[]>;
      };
    };
    message?: string;
  };

  const validationErrors = err.response?.data?.errors;
  if (validationErrors) {
    const firstError = Object.values(validationErrors)[0]?.[0];
    if (firstError) return firstError;
  }

  return (
    err.response?.data?.message ??
    err.message ??
    'Something went wrong. Please try again.'
  );
}

function formatPrice(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return 'Not set';
  const amount = Number(value);
  return Number.isFinite(amount) ? `₹${amount.toFixed(2)}` : 'Not set';
}

export default function ClinicServicesScreen() {
  const router = useRouter();
  const styles = useStyles();
  const COLORS = useAppColors();
  const { user, isLoading: authLoading } = useAuth();

  const isClinic = getRoleName(user?.role) === 'clinic';

  const [offerings, setOfferings] = useState<ClinicServiceOffering[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadOfferings = useCallback(async () => {
    if (!isClinic) {
      setOfferings([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setError(null);
      const result = await getClinicServiceOfferings({
        search: search.trim() || undefined,
        per_page: 100,
      });
      setOfferings(result.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isClinic, search]);

  useEffect(() => {
    if (authLoading) return;
    setLoading(true);
    void loadOfferings();
  }, [authLoading, loadOfferings]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadOfferings();
  }, [loadOfferings]);

  const handleStatusChange = (item: ClinicServiceOffering) => {
    const nextStatus = !item.is_active;
    const serviceName = item.dental_service?.name ?? 'this service';

    showAppDialog(
      `${nextStatus ? 'Activate' : 'Deactivate'} service`,
      `Are you sure you want to ${nextStatus ? 'activate' : 'deactivate'} "${serviceName}" for your clinic?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: nextStatus ? 'Activate' : 'Deactivate',
          style: nextStatus ? 'default' : 'destructive',
          onPress: async () => {
            try {
              setUpdatingId(item.id);
              await updateClinicServiceOfferingStatus(item.id, nextStatus);
              await loadOfferings();
            } catch (err) {
              showAppDialog('Unable to update status', getErrorMessage(err));
            } finally {
              setUpdatingId(null);
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: ClinicServiceOffering }) => {
    const service = item.dental_service;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <AppText style={styles.cardTitle}>
            {service?.name ?? `Dental service #${item.dental_service_id}`}
          </AppText>
          <StatusBadge
            label={item.is_active ? 'Active' : 'Inactive'}
            variant={item.is_active ? 'success' : 'danger'}
          />
        </View>

        {!!service?.description && (
          <AppText variant="muted">{service.description}</AppText>
        )}

        <View style={styles.serviceDetails}>
          <View style={styles.serviceDetailItem}>
            <AppText variant="muted">Your clinic price</AppText>
            <AppText variant="label">{formatPrice(item.price)}</AppText>
          </View>
          <View style={styles.serviceDetailItem}>
            <AppText variant="muted">Appointment duration</AppText>
            <AppText variant="label">{item.duration_minutes} minutes</AppText>
          </View>
        </View>

        {service && (
          <AppText variant="muted">
            Common catalogue default: {formatPrice(service.price)} · {service.duration_minutes} minutes
          </AppText>
        )}

        <View style={styles.actionsRow}>
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/clinic-services/[id]/edit',
                params: { id: String(item.id) },
              })
            }
            accessibilityRole="button"
            style={[styles.actionButton, styles.editButton]}
          >
            <AppText style={styles.actionButtonText}>Edit</AppText>
          </Pressable>

          <Pressable
            disabled={updatingId === item.id}
            onPress={() => handleStatusChange(item)}
            accessibilityRole="button"
            accessibilityState={{ disabled: updatingId === item.id }}
            style={[
              styles.actionButton,
              {
                backgroundColor: item.is_active ? COLORS.danger : COLORS.success,
                opacity: updatingId === item.id ? 0.6 : 1,
              },
            ]}
          >
            {updatingId === item.id ? (
              <ActivityIndicator size="small" color={COLORS.badgeText} />
            ) : (
              <AppText style={styles.actionButtonText}>
                {item.is_active ? 'Deactivate' : 'Activate'}
              </AppText>
            )}
          </Pressable>
        </View>
      </View>
    );
  };

  if (authLoading) {
    return (
      <View style={styles.emptyState}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  if (!isClinic) {
    return (
      <View style={styles.container}>
        <AppText variant="title">Our Services</AppText>
        <AppText variant="muted">
          Clinic service offerings are available to clinic accounts.
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Our Services"
        subtitle="Manage the dental services offered by your clinic."
        count={offerings.length}
        actionTitle="Add Service"
        onAction={() => router.push('/clinic-services/add')}
      />

      <AppInput
        style={styles.searchInput}
        value={search}
        onChangeText={setSearch}
        placeholder="Search your clinic services..."
        returnKeyType="search"
        accessibilityLabel="Search clinic service offerings"
      />

      {!!error && (
        <View style={styles.errorContainer}>
          <AppText variant="error">{error}</AppText>
          <Pressable onPress={() => {
            setLoading(true);
            void loadOfferings();
          }}>
            <AppText variant="link">Retry</AppText>
          </Pressable>
        </View>
      )}

      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <AppText variant="muted">Loading your clinic services...</AppText>
        </View>
      ) : (
        <FlatList
          data={offerings}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <AppText variant="label">No clinic services found</AppText>
              <AppText variant="muted">
                {search.trim()
                  ? 'Try another search term.'
                  : 'Add services from the common dental catalogue to get started.'}
              </AppText>
            </View>
          }
        />
      )}
    </View>
  );
}
