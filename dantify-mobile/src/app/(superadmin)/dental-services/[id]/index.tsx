
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,

  Pressable,
  ScrollView,
  View
} from 'react-native';

import { showAppDialog } from "@/components/ui/app-dialog";
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppText } from '@/components/ui/app-text';
import { StatusBadge } from '@/components/ui/status-badge';

import { useAuth } from '@/contexts/auth-context';
import { useStyles } from '@/styles/styles';
import { useAppColors } from '@/hooks/use-app-colors';

import {
  getDentalService,
  updateDentalServiceStatus,
} from '@/services/dental-service-service';

import type { DentalService } from '@/types/dental-service';

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

function formatPrice(price: string | number): string {
  const numericPrice = Number(price);

  if (!Number.isFinite(numericPrice)) {
    return `₹${price}`;
  }

  return `₹${numericPrice.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function DentalServiceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const styles = useStyles();
  const colors = useAppColors();
  const { user, isLoading: authLoading } = useAuth();

  const roleName =
    typeof user?.role === 'string'
      ? user.role
      : user?.role?.name;

  const isSuperAdmin = roleName === 'superadmin';
  const serviceId = Number(id);
  const validId = Number.isInteger(serviceId) && serviceId > 0;

  const [service, setService] = useState<DentalService | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadService = useCallback(async () => {
    if (!validId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await getDentalService(serviceId);
      setService(result);
    } catch (error) {
      showAppDialog(
        'Unable to load service',
        getErrorMessage(error),
        [
          {
            text: 'OK',
            onPress: () =>
              router.replace('/dental-services'),
          },
        ],
      );
    } finally {
      setLoading(false);
    }
  }, [validId, serviceId, router]);

  useEffect(() => {
    if (!authLoading && isSuperAdmin && validId) {
      void loadService();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, isSuperAdmin, validId, loadService]);

  const handleToggleStatus = () => {
    if (!service || updatingStatus) return;

    const nextStatus = !service.is_active;
    const action = nextStatus ? 'activate' : 'deactivate';

    showAppDialog(
      `${nextStatus ? 'Activate' : 'Deactivate'} Service`,
      `Are you sure you want to ${action} "${service.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: nextStatus ? 'Activate' : 'Deactivate',
          style: nextStatus ? 'default' : 'destructive',
          onPress: () => void confirmToggleStatus(nextStatus),
        },
      ],
    );
  };

  const confirmToggleStatus = async (nextStatus: boolean) => {
    if (!service || updatingStatus) return;

    try {
      setUpdatingStatus(true);

      const updatedService = await updateDentalServiceStatus(
        service.id,
        nextStatus,
      );

      setService(updatedService);

      showAppDialog(
        'Status updated',
        `The service is now ${nextStatus ? 'active' : 'inactive'}.`,
      );
    } catch (error) {
      showAppDialog(
        'Unable to update status',
        getErrorMessage(error),
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (authLoading || loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isSuperAdmin) {
    return (
      <View style={styles.container}>
        <AppText variant="title">Access restricted</AppText>
        <AppText variant="muted">
          Only Super Admin can view and manage the common service catalogue.
        </AppText>
      </View>
    );
  }

  if (!validId || !service) {
    return (
      <View style={styles.container}>
        <AppText variant="title">Service not found</AppText>
        <AppText variant="muted">
          The requested dental service could not be found.
        </AppText>

        <Pressable
          onPress={() =>
            router.replace('/dental-services')
          }
          style={[styles.actionButton, styles.editButton]}
        >
          <AppText style={styles.actionButtonText}>
            Back to Services
          </AppText>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.screenHeader}>
          <View style={styles.screenHeaderContent}>
            <AppText variant="title">{service.name}</AppText>
            <AppText variant="muted">
              Master Dental Service Catalogue
            </AppText>
          </View>

          <StatusBadge
            label={service.is_active ? 'Active' : 'Inactive'}
            variant={service.is_active ? 'success' : 'danger'}
          />
        </View>

        <View style={styles.card}>
          <AppText style={styles.cardTitle}>Service Information</AppText>

          <View style={styles.serviceDetails}>
            <View style={styles.serviceDetailItem}>
              <AppText variant="muted">Service ID</AppText>
              <AppText variant="body">{service.id}</AppText>
            </View>

            <View style={styles.serviceDetailItem}>
              <AppText variant="muted">Service Name</AppText>
              <AppText variant="body">{service.name}</AppText>
            </View>

            <View style={styles.serviceDetailItem}>
              <AppText variant="muted">Description</AppText>
              <AppText variant="body">
                {service.description?.trim() || 'No description provided'}
              </AppText>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <AppText style={styles.cardTitle}>
            Default Pricing & Duration
          </AppText>

          <View style={styles.serviceDetails}>
            <View style={styles.serviceDetailItem}>
              <AppText variant="muted">Default Price</AppText>
              <AppText variant="body">
                {formatPrice(service.price)}
              </AppText>
            </View>

            <View style={styles.serviceDetailItem}>
              <AppText variant="muted">Default Duration</AppText>
              <AppText variant="body">
                {service.duration_minutes} minutes
              </AppText>
            </View>
          </View>

          <AppText variant="muted">
            These are master catalogue defaults. Individual clinics may
            configure their own prices and durations.
          </AppText>
        </View>

        <View style={styles.card}>
          <AppText style={styles.cardTitle}>Catalogue Status</AppText>

          <View style={styles.serviceDetails}>
            <View style={styles.serviceDetailItem}>
              <AppText variant="muted">Current Status</AppText>
              <StatusBadge
                label={service.is_active ? 'Active' : 'Inactive'}
                variant={service.is_active ? 'success' : 'danger'}
              />
            </View>

            {service.created_at ? (
              <View style={styles.serviceDetailItem}>
                <AppText variant="muted">Created</AppText>
                <AppText variant="body">
                  {new Date(service.created_at).toLocaleString()}
                </AppText>
              </View>
            ) : null}

            {service.updated_at ? (
              <View style={styles.serviceDetailItem}>
                <AppText variant="muted">Last Updated</AppText>
                <AppText variant="body">
                  {new Date(service.updated_at).toLocaleString()}
                </AppText>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/(superadmin)/dental-services/[id]/edit',
                params: { id: String(service.id) },
              })
            }
            accessibilityRole="button"
            style={[styles.actionButton, styles.replyButton]}
          >
            <AppText style={styles.actionButtonText}>
              Edit Service
            </AppText>
          </Pressable>

          <Pressable
            onPress={handleToggleStatus}
            disabled={updatingStatus}
            accessibilityRole="button"
            style={[
              styles.actionButton,
              service.is_active
                ? styles.deleteButton
                : styles.editButton,
              updatingStatus && styles.disabledButton,
            ]}
          >
            {updatingStatus ? (
              <ActivityIndicator color={colors.badgeText} />
            ) : (
              <AppText style={styles.actionButtonText}>
                {service.is_active ? 'Deactivate' : 'Activate'}
              </AppText>
            )}
          </Pressable>
        </View>

        <Pressable
          onPress={() =>
            router.replace('/dental-services')
          }
          accessibilityRole="button"
          style={[styles.actionButton, styles.editButton]}
        >
          <AppText style={styles.actionButtonText}>
            Back to Catalogue
          </AppText>
        </Pressable>
      </ScrollView>
    </View>
  );
}
