
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Switch,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppText } from '@/components/ui/app-text';
import { AppInput } from '@/components/ui/app-input';
import { StatusBadge } from '@/components/ui/status-badge';

import { useAuth } from '@/contexts/auth-context';
import { useStyles } from '@/styles/styles';
import { useAppColors } from '@/hooks/use-app-colors';

import {
  getDentalService,
  updateDentalService,
} from '@/services/dental-service-service';

import type { UpdateDentalServicePayload } from '@/types/dental-service';

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

export default function EditDentalServiceScreen() {
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

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('30');
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading || !isSuperAdmin || !validId) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const loadService = async () => {
      try {
        setLoading(true);

        const service = await getDentalService(serviceId);

        if (!mounted) return;

        setName(service.name ?? '');
        setDescription(service.description ?? '');
        setPrice(String(service.price ?? ''));
        setDuration(String(service.duration_minutes ?? 30));
        setIsActive(service.is_active);
      } catch (error) {
        if (mounted) {
          Alert.alert(
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
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadService();

    return () => {
      mounted = false;
    };
  }, [authLoading, isSuperAdmin, validId, serviceId, router]);

  const handleSave = async () => {
    if (saving) return;

    const serviceName = name.trim();
    const numericPrice = Number(price);
    const numericDuration = Number(duration);

    if (!serviceName) {
      Alert.alert('Service name required', 'Please enter a service name.');
      return;
    }

    if (
      !price.trim() ||
      !Number.isFinite(numericPrice) ||
      numericPrice < 0
    ) {
      Alert.alert('Invalid price', 'Please enter a valid default price.');
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

    const payload: UpdateDentalServicePayload = {
      name: serviceName,
      description: description.trim() || null,
      price: numericPrice,
      duration_minutes: numericDuration,
      is_active: isActive,
    };

    try {
      setSaving(true);

      await updateDentalService(serviceId, payload);

      Alert.alert(
        'Service updated',
        `"${serviceName}" has been updated successfully.`,
        [
          {
            text: 'OK',
            onPress: () =>
              router.replace(
                `/dental-services/${serviceId}`,
              ),
          },
        ],
      );
    } catch (error) {
      Alert.alert('Unable to update service', getErrorMessage(error));
    } finally {
      setSaving(false);
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
          Only Super Admin can manage the common service catalogue.
        </AppText>
      </View>
    );
  }

  if (!validId) {
    return (
      <View style={styles.container}>
        <AppText variant="title">Invalid service ID</AppText>
        <Pressable
          onPress={() =>
            router.replace('/(superadmin)/dental-services')
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
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <AppText variant="title">Edit Common Service</AppText>

        <AppText variant="muted">
          Update the master dental catalogue. Clinics may configure
          their own prices and durations separately.
        </AppText>

        <View style={styles.card}>
          <AppText style={styles.cardTitle}>Service Information</AppText>

          <AppText style={styles.sectionLabel}>Service Name *</AppText>
          <AppInput
            style={styles.textInput}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Root Canal Treatment"
            autoCapitalize="words"
            maxLength={150}
            editable={!saving}
          />

          <AppText style={styles.sectionLabel}>Description</AppText>
          <AppInput
            style={styles.textInput}
            value={description}
            onChangeText={setDescription}
            placeholder="Briefly describe the dental service"
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
            These are catalogue defaults. Clinics may use different values.
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
            <AppText style={styles.cardTitle}>Availability</AppText>
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
            Inactive services are not available for new clinic additions.
          </AppText>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => void handleSave()}
            disabled={saving}
            accessibilityRole="button"
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
            <AppText style={styles.actionButtonText}>Cancel</AppText>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
