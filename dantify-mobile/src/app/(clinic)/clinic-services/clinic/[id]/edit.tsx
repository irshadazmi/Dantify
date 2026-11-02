
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { AppText } from '@/components/ui/app-text';
import { AppInput } from '@/components/ui/app-input';
import { StatusBadge } from '@/components/ui/status-badge';

import { useStyles } from '@/styles/styles';

import {
  getClinicServices,
  updateClinicService,
} from '@/services/dental-service';

import type { ClinicService } from '@/types/service';

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

    if (firstError) {
      return firstError;
    }
  }

  return (
    err.response?.data?.message ??
    err.message ??
    'Something went wrong. Please try again.'
  );
}

function formatPrice(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return 'Not set';
  }

  const price = Number(value);

  return Number.isFinite(price)
    ? `₹${price.toFixed(2)}`
    : 'Not set';
}

export default function EditClinicServiceScreen() {
  const router = useRouter();
  const styles = useStyles();

  const { id } = useLocalSearchParams<{ id: string }>();

  const clinicServiceId = Number(id);

  const [clinicService, setClinicService] =
    useState<ClinicService | null>(null);

  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load the clinic service selected from the Our Services screen.
  const loadClinicService = useCallback(async () => {
    if (!Number.isInteger(clinicServiceId) || clinicServiceId <= 0) {
      setError('Invalid clinic service ID.');
      setLoading(false);
      return;
    }

    try {
      setError(null);

      const result = await getClinicServices({
        per_page: 100,
      });

      const selected = result.data.find(
        (item) => item.id === clinicServiceId,
      );

      if (!selected) {
        setClinicService(null);
        setError('The requested clinic service could not be found.');
        return;
      }

      setClinicService(selected);
      setPrice(String(selected.price));
      setDuration(String(selected.duration_minutes));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [clinicServiceId]);

  useEffect(() => {
    void loadClinicService();
  }, [loadClinicService]);

  // Validate and update clinic-specific price and duration.
  const handleSave = async () => {
    if (!clinicService || saving) {
      return;
    }

    const numericPrice = Number(price);
    const numericDuration = Number(duration);

    if (
      !price.trim() ||
      !Number.isFinite(numericPrice) ||
      numericPrice < 0
    ) {
      Alert.alert(
        'Invalid price',
        'Please enter a valid clinic service price.',
      );
      return;
    }

    if (
      !duration.trim() ||
      !Number.isInteger(numericDuration) ||
      numericDuration <= 0
    ) {
      Alert.alert(
        'Invalid duration',
        'Please enter a positive whole number of minutes.',
      );
      return;
    }

    try {
      setSaving(true);

      await updateClinicService(clinicService.id, {
        price: numericPrice,
        duration_minutes: numericDuration,
      });

      Alert.alert(
        'Service updated',
        `${clinicService.service.name} has been updated successfully.`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ],
      );
    } catch (err) {
      Alert.alert(
        'Unable to update service',
        getErrorMessage(err),
      );
    } finally {
      setSaving(false);
    }
  };

  // Loading state.
  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Edit Clinic Service' }} />

        <View style={styles.emptyState}>
          <ActivityIndicator size="large" />

          <AppText variant="muted">
            Loading clinic service...
          </AppText>
        </View>
      </View>
    );
  }

  // Error or missing service state.
  if (!clinicService) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Edit Clinic Service' }} />

        <View style={styles.emptyState}>
          <AppText variant="title">
            Unable to load service
          </AppText>

          <AppText variant="error">
            {error ?? 'Clinic service not found.'}
          </AppText>

          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            style={[styles.actionButton, styles.editButton]}
          >
            <AppText style={styles.actionButtonText}>
              Go Back
            </AppText>
          </Pressable>

          <Pressable
            onPress={() => {
              setLoading(true);
              void loadClinicService();
            }}
            accessibilityRole="button"
            style={[styles.actionButton, styles.replyButton]}
          >
            <AppText style={styles.actionButtonText}>
              Retry
            </AppText>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Edit Clinic Service' }} />

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <AppText variant="title">
          Edit Clinic Service
        </AppText>

        <AppText variant="muted">
          Update the price and appointment duration for this service
          at your clinic.
        </AppText>

        {/* Service information */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <AppText style={styles.cardTitle}>
              {clinicService.service.name}
            </AppText>

            <StatusBadge
              label={clinicService.is_active ? 'Active' : 'Inactive'}
              variant={clinicService.is_active ? 'success' : 'danger'}
            />
          </View>

          {!!clinicService.service.description && (
            <AppText variant="muted">
              {clinicService.service.description}
            </AppText>
          )}

          <View style={styles.serviceDetails}>
            <View style={styles.serviceDetailItem}>
              <AppText variant="muted">
                Catalogue Price
              </AppText>

              <AppText variant="label">
                {formatPrice(clinicService.service.price)}
              </AppText>
            </View>

            <View style={styles.serviceDetailItem}>
              <AppText variant="muted">
                Catalogue Duration
              </AppText>

              <AppText variant="label">
                {clinicService.service.duration_minutes} minutes
              </AppText>
            </View>
          </View>
        </View>

        {/* Clinic-specific configuration */}
        <View style={styles.card}>
          <AppText style={styles.cardTitle}>
            Your Clinic Settings
          </AppText>

          <AppText variant="muted">
            These values apply only to your clinic. Changes will not
            affect the common dental service catalogue.
          </AppText>

          <View>
            <AppText style={styles.sectionLabel}>
              Clinic Price (₹)
            </AppText>

            <AppInput
              style={styles.textInput}
              value={price}
              onChangeText={setPrice}
              placeholder="Enter clinic price"
              keyboardType="decimal-pad"
              editable={!saving}
            />
          </View>

          <View>
            <AppText style={styles.sectionLabel}>
              Duration (minutes)
            </AppText>

            <AppInput
              style={styles.textInput}
              value={duration}
              onChangeText={setDuration}
              placeholder="Enter duration in minutes"
              keyboardType="number-pad"
              editable={!saving}
            />
          </View>

          <AppText variant="muted">
            Current clinic price: {formatPrice(clinicService.price)}
            {' · '}
            {clinicService.duration_minutes} minutes
          </AppText>

          <View style={styles.actionsRow}>
            <Pressable
              onPress={() => void handleSave()}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Save clinic service changes"
              accessibilityState={{
                disabled: saving,
                busy: saving,
              }}
              style={[
                styles.actionButton,
                styles.replyButton,
                saving && styles.disabledButton,
              ]}
            >
              {saving ? (
                <ActivityIndicator color="white" />
              ) : (
                <AppText style={styles.actionButtonText}>
                  Save Changes
                </AppText>
              )}
            </Pressable>

            <Pressable
              onPress={() => router.back()}
              disabled={saving}
              accessibilityRole="button"
              style={[
                styles.actionButton,
                styles.editButton,
                saving && styles.disabledButton,
              ]}
            >
              <AppText style={styles.actionButtonText}>
                Cancel
              </AppText>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
