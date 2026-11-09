import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,

  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View
} from 'react-native';

import { showAppDialog } from "@/components/ui/app-dialog";
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { AppText } from '@/components/ui/app-text';
import { AppInput } from '@/components/ui/app-input';
import { StatusBadge } from '@/components/ui/status-badge';

import { useStyles } from '@/styles/styles';

import {
  getClinicServiceOfferings,
  updateClinicServiceOffering,
} from '@/services/clinic-service-offering-service';

import type { ClinicServiceOffering } from '@/types/clinic-service-offering';

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

export default function EditClinicServiceScreen() {
  const router = useRouter();
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const clinicOfferingId = Number(id);

  const [offering, setOffering] = useState<ClinicServiceOffering | null>(null);
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOffering = useCallback(async () => {
    if (!Number.isInteger(clinicOfferingId) || clinicOfferingId <= 0) {
      setError('Invalid clinic service offering ID.');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const result = await getClinicServiceOfferings({ per_page: 100 });
      const selected = result.data.find((item) => item.id === clinicOfferingId);

      if (!selected) {
        setOffering(null);
        setError('The requested clinic service offering could not be found.');
        return;
      }

      setOffering(selected);
      setPrice(String(selected.price));
      setDuration(String(selected.duration_minutes));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [clinicOfferingId]);

  useEffect(() => {
    void loadOffering();
  }, [loadOffering]);

  const handleSave = async () => {
    if (!offering || saving) return;

    const numericPrice = Number(price);
    const numericDuration = Number(duration);

    if (!price.trim() || !Number.isFinite(numericPrice) || numericPrice < 0) {
      showAppDialog('Invalid price', 'Enter a valid clinic price (zero or greater).');
      return;
    }

    if (!duration.trim() || !Number.isInteger(numericDuration) || numericDuration <= 0) {
      showAppDialog('Invalid duration', 'Enter a positive whole number of minutes.');
      return;
    }

    try {
      setSaving(true);
      await updateClinicServiceOffering(offering.id, {
        price: numericPrice,
        duration_minutes: numericDuration,
      });
      showAppDialog(
        'Offering updated',
        `${offering.dental_service?.name ?? 'Clinic service'} has been updated.`,
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (err) {
      showAppDialog('Unable to update offering', getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Edit Clinic Offering' }} />
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" />
          <AppText variant="muted">Loading clinic offering...</AppText>
        </View>
      </View>
    );
  }

  if (!offering) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Edit Clinic Offering' }} />
        <View style={styles.emptyState}>
          <AppText variant="title">Unable to load offering</AppText>
          <AppText variant="error">{error ?? 'Clinic offering not found.'}</AppText>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            style={[styles.actionButton, styles.editButton]}
          >
            <AppText style={styles.actionButtonText}>Go Back</AppText>
          </Pressable>
          <Pressable
            onPress={() => {
              setLoading(true);
              void loadOffering();
            }}
            accessibilityRole="button"
            style={[styles.actionButton, styles.replyButton]}
          >
            <AppText style={styles.actionButtonText}>Retry</AppText>
          </Pressable>
        </View>
      </View>
    );
  }

  const service = offering.dental_service;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
    >
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Edit Clinic Offering' }} />
      <ScrollView
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: 40 },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        <AppText variant="title">Edit Clinic Offering</AppText>
        <AppText variant="muted">
          Change the price and appointment duration configured by your clinic.
        </AppText>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <AppText style={styles.cardTitle}>
              {service?.name ?? `Dental service #${offering.dental_service_id}`}
            </AppText>
            <StatusBadge
              label={offering.is_active ? 'Active' : 'Inactive'}
              variant={offering.is_active ? 'success' : 'danger'}
            />
          </View>

          {!!service?.description && (
            <AppText variant="muted">{service.description}</AppText>
          )}

          {service && (
            <View style={styles.serviceDetails}>
              <View style={styles.serviceDetailItem}>
                <AppText variant="muted">Common catalogue price</AppText>
                <AppText variant="label">{formatPrice(service.price)}</AppText>
              </View>
              <View style={styles.serviceDetailItem}>
                <AppText variant="muted">Catalogue duration</AppText>
                <AppText variant="label">{service.duration_minutes} minutes</AppText>
              </View>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <AppText style={styles.cardTitle}>Your Clinic Settings</AppText>
          <AppText variant="muted">
            These values belong to this clinic offering and do not change the common dental catalogue.
          </AppText>

          <AppText style={styles.sectionLabel}>Clinic price (₹)</AppText>
          <AppInput
            style={styles.textInput}
            value={price}
            onChangeText={setPrice}
            placeholder="Enter clinic price"
            keyboardType="decimal-pad"
            editable={!saving}
          />

          <AppText style={styles.sectionLabel}>Appointment duration (minutes)</AppText>
          <AppInput
            style={styles.textInput}
            value={duration}
            onChangeText={setDuration}
            placeholder="Enter duration in minutes"
            keyboardType="number-pad"
            editable={!saving}
          />

          <AppText variant="muted">
            Current clinic settings: {formatPrice(offering.price)} · {offering.duration_minutes} minutes
          </AppText>

          <View style={styles.actionsRow}>
            <Pressable
              onPress={() => void handleSave()}
              disabled={saving}
              accessibilityRole="button"
              accessibilityState={{ disabled: saving, busy: saving }}
              style={[
                styles.actionButton,
                styles.replyButton,
                saving && styles.disabledButton,
              ]}
            >
              {saving ? (
                <ActivityIndicator color="white" />
              ) : (
                <AppText style={styles.actionButtonText}>Save Changes</AppText>
              )}
            </Pressable>

            <Pressable
              onPress={() => router.back()}
              disabled={saving}
              accessibilityRole="button"
              style={[styles.actionButton, styles.editButton]}
            >
              <AppText style={styles.actionButtonText}>Cancel</AppText>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
    </KeyboardAvoidingView>
  );
}
