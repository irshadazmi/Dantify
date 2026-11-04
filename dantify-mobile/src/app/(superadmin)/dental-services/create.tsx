
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Switch,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { AppText } from '@/components/ui/app-text';
import { AppInput } from '@/components/ui/app-input';
import { StatusBadge } from '@/components/ui/status-badge';

import { useAuth } from '@/contexts/auth-context';
import { useStyles } from '@/styles/styles';
import { useAppColors } from '@/hooks/use-app-colors';

import { createService } from '@/services/dental-service';

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

export default function CreateServiceScreen() {
  const router = useRouter();
  const styles = useStyles();
  const colors = useAppColors();
  const { user, isLoading: authLoading } = useAuth();

  const roleName =
    typeof user?.role === 'string'
      ? user.role
      : user?.role?.name;

  const isSuperAdmin = roleName === 'superadmin';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('30');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (saving) return;

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

      await createService({
        name: serviceName,
        description: description.trim() || null,
        price: numericPrice,
        duration_minutes: numericDuration,
        is_active: isActive,
      });

      Alert.alert(
        'Service created',
        `"${serviceName}" has been added to the common catalogue.`,
        [
          {
            text: 'OK',
            onPress: () => router.replace('/dental-services'),
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        'Unable to create service',
        getErrorMessage(error),
      );
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
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

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <AppText variant="title">
          Add Common Service
        </AppText>

        <AppText variant="muted">
          Create a service in the master dental catalogue.
          Clinics can select this service and configure
          their own price and duration.
        </AppText>

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
            placeholder="e.g. Root Canal Treatment"
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
            These values are defaults. Clinics may use
            different prices and durations.
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
              Availability
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
            Active services can be selected by clinics.
            Inactive services are not available for new additions.
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
                Create Service
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
