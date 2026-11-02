
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Switch,
  View,
} from 'react-native';
import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import { AppText } from '@/components/ui/app-text';
import { AppInput } from '@/components/ui/app-input';
import { StatusBadge } from '@/components/ui/status-badge';

import { useAuth } from '@/contexts/auth-context';
import { useStyles } from '@/styles/styles';
import { useAppColors } from '@/hooks/use-app-colors';

import {
  getService,
  updateService,
} from '@/services/dental-service';

import type { Service } from '@/types/service';

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

function formatPrice(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return 'Not set';
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? `₹${number.toFixed(2)}`
    : 'Not set';
}

export default function EditServiceScreen() {
  const router = useRouter();
  const styles = useStyles();
  const colors = useAppColors();

  const { id } = useLocalSearchParams<{ id: string }>();
  const serviceId = Number(id);

  const { user, isLoading: authLoading } = useAuth();

  const roleName =
    typeof user?.role === 'string'
      ? user.role
      : user?.role?.name;

  const isSuperAdmin = roleName === 'superadmin';

  const [service, setService] = useState<Service | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadService = useCallback(async () => {
    if (!Number.isInteger(serviceId) || serviceId <= 0) {
      setError('Invalid service ID.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await getService(serviceId);

      setService(result);
      setName(result.name);
      setDescription(result.description ?? '');
      setPrice(String(result.price ?? ''));
      setDuration(String(result.duration_minutes ?? ''));
      setIsActive(Boolean(result.is_active));
    } catch (err) {
      setService(null);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    if (!authLoading && isSuperAdmin) {
      void loadService();
    }
  }, [authLoading, isSuperAdmin, loadService]);

  const handleSave = async () => {
    if (!service || saving) return;

    const serviceName = name.trim();
    const numericPrice = Number(price);
    const numericDuration = Number(duration);

    if (!serviceName) {
      Alert.alert(
        'Service name required',
        'Please enter a service name.',
      );
      return;
    }

    if (
      !price.trim() ||
      !Number.isFinite(numericPrice) ||
      numericPrice < 0
    ) {
      Alert.alert(
        'Invalid price',
        'Please enter a valid default price.',
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
        'Duration must be a positive whole number of minutes.',
      );
      return;
    }

    try {
      setSaving(true);

      await updateService(service.id, {
        name: serviceName,
        description: description.trim() || null,
        price: numericPrice,
        duration_minutes: numericDuration,
        is_active: isActive,
      });

      Alert.alert(
        'Service updated',
        `"${serviceName}" has been updated successfully.`,
        [
          {
            text: 'OK',
            onPress: () => router.replace('/services'),
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

  if (authLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isSuperAdmin) {
    return (
      <View style={styles.container}>
        <AppText variant="title">
          Access restricted
        </AppText>

        <AppText variant="muted">
          Only Super Admin can edit common catalogue services.
        </AppText>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />

          <AppText variant="muted">
            Loading service...
          </AppText>
        </View>
      </View>
    );
  }

  if (!service) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <AppText variant="title">
            Unable to load service
          </AppText>

          <AppText variant="error">
            {error ?? 'Service not found.'}
          </AppText>

          <View style={styles.actionsRow}>
            <Pressable
              onPress={() => void loadService()}
              accessibilityRole="button"
              style={[
                styles.actionButton,
                styles.replyButton,
              ]}
            >
              <AppText style={styles.actionButtonText}>
                Retry
              </AppText>
            </Pressable>

            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              style={[
                styles.actionButton,
                styles.editButton,
              ]}
            >
              <AppText style={styles.actionButtonText}>
                Go Back
              </AppText>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <AppText variant="title">
          Edit Common Service
        </AppText>

        <AppText variant="muted">
          Update the master service details and catalogue defaults.
        </AppText>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <AppText style={styles.cardTitle}>
              {service.name}
            </AppText>

            <StatusBadge
              label={isActive ? 'Active' : 'Inactive'}
              variant={isActive ? 'success' : 'danger'}
            />
          </View>

          <AppText variant="muted">
            Current default price: {formatPrice(service.price)}
            {' · '}
            {service.duration_minutes} minutes
          </AppText>
        </View>

        <View style={styles.card}>
          <AppText style={styles.cardTitle}>
            Service Information
          </AppText>

          <AppText style={styles.sectionLabel}>
            Service Name *
          </AppText>

          <AppInput
            style={styles.textInput}
            value={name}
            onChangeText={setName}
            placeholder="Service name"
            autoCapitalize="words"
            maxLength={150}
            editable={!saving}
          />

          <AppText style={styles.sectionLabel}>
            Description
          </AppText>

          <AppInput
            style={styles.textInput}
            value={description}
            onChangeText={setDescription}
            placeholder="Service description"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            editable={!saving}
          />
        </View>

        <View style={styles.card}>
          <AppText style={styles.cardTitle}>
            Default Pricing & Duration
          </AppText>

          <AppText variant="muted">
            These defaults apply to the common catalogue.
            Existing clinic-specific values remain independent.
          </AppText>

          <View style={styles.phoneRow}>
            <View style={styles.phoneInput}>
              <AppText style={styles.sectionLabel}>
                Default Price (₹) *
              </AppText>

              <AppInput
                style={styles.textInput}
                value={price}
                onChangeText={setPrice}
                placeholder="0.00"
                keyboardType="decimal-pad"
                editable={!saving}
              />
            </View>

            <View style={styles.phoneInput}>
              <AppText style={styles.sectionLabel}>
                Duration (min) *
              </AppText>

              <AppInput
                style={styles.textInput}
                value={duration}
                onChangeText={setDuration}
                placeholder="30"
                keyboardType="number-pad"
                editable={!saving}
              />
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <AppText style={styles.cardTitle}>
              Catalogue Availability
            </AppText>

            <StatusBadge
              label={isActive ? 'Active' : 'Inactive'}
              variant={isActive ? 'success' : 'danger'}
            />
          </View>

          <View style={styles.headerRow}>
            <AppText variant="body">
              Active in Common Catalogue
            </AppText>

            <Switch
              value={isActive}
              onValueChange={setIsActive}
              disabled={saving}
              trackColor={{
                false: colors.border,
                true: colors.success,
              }}
              thumbColor={colors.card}
            />
          </View>

          <AppText variant="muted">
            Deactivating a common service prevents new clinic
            additions. It does not automatically deactivate
            existing clinic offerings.
          </AppText>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => void handleSave()}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Save common service changes"
            style={[
              styles.actionButton,
              styles.replyButton,
              saving && styles.disabledButton,
            ]}
          >
            {saving ? (
              <ActivityIndicator color={colors.badgeText} />
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
      </ScrollView>
    </View>
  );
}
