
import React, { useCallback, useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  View,
} from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppText } from '@/components/ui/app-text';
import { StatusBadge } from '@/components/ui/status-badge';

import { useAuth } from '@/contexts/auth-context';
import { useStyles } from '@/styles/styles';
import { useAppColors } from '@/hooks/use-app-colors';

import {
  getMedicine,
  updateMedicineStatus,
} from '@/services/medicine-service';

import type { Medicine } from '@/types/medicine';

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

  const errors = err.response?.data?.errors;
  if (errors) {
    const firstError = Object.values(errors)[0]?.[0];
    if (firstError) return firstError;
  }

  return (
    err.response?.data?.message ??
    err.message ??
    'Something went wrong. Please try again.'
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  const displayValue = value?.trim() || 'Not specified';

  return (
    <View style={{ marginBottom: 14 }}>
      <AppText variant="muted">{label}</AppText>
      <AppText variant="body">{displayValue}</AppText>
    </View>
  );
}

export default function MedicineDetailScreen() {
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

  const medicineId = Number(id);
  const validId =
    Number.isInteger(medicineId) && medicineId > 0;

  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadMedicine = useCallback(async () => {
    if (!validId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const result = await getMedicine(medicineId);
      setMedicine(result);
    } catch (error) {
      Alert.alert(
        'Unable to load medicine',
        getErrorMessage(error),
        [
          {
            text: 'OK',
            onPress: () => router.replace('/medicines'),
          },
        ],
      );
    } finally {
      setLoading(false);
    }
  }, [validId, medicineId, router]);

  useEffect(() => {
    if (!authLoading && isSuperAdmin && validId) {
      void loadMedicine();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, isSuperAdmin, validId, loadMedicine]);

  const handleToggleStatus = () => {
    if (!medicine || updatingStatus) return;

    const nextStatus = !medicine.is_active;

    Alert.alert(
      `${nextStatus ? 'Activate' : 'Deactivate'} Medicine`,
      `Are you sure you want to ${
        nextStatus ? 'activate' : 'deactivate'
      } "${medicine.name}"?`,
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
    if (!medicine || updatingStatus) return;

    try {
      setUpdatingStatus(true);

      const updated = await updateMedicineStatus(
        medicine.id,
        nextStatus,
      );

      setMedicine(updated);

      Alert.alert(
        'Status updated',
        `The medicine is now ${
          nextStatus ? 'active' : 'inactive'
        }.`,
      );
    } catch (error) {
      Alert.alert(
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
          Only Super Admin can view and manage the medicine catalogue.
        </AppText>
      </View>
    );
  }

  if (!validId || !medicine) {
    return (
      <View style={styles.container}>
        <AppText variant="title">Medicine not found</AppText>
        <AppText variant="muted">
          The requested medicine could not be found.
        </AppText>

        <Pressable
          onPress={() => router.replace('/medicines')}
          style={[styles.actionButton, styles.editButton]}
        >
          <AppText style={styles.actionButtonText}>
            Back to Medicines
          </AppText>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.screenHeader}>
          <View style={styles.screenHeaderContent}>
            <AppText variant="title">{medicine.name}</AppText>
            <AppText variant="muted">
              Master Medicine Catalogue
            </AppText>
          </View>

          <StatusBadge
            label={medicine.is_active ? 'Active' : 'Inactive'}
            variant={medicine.is_active ? 'success' : 'danger'}
          />
        </View>

        {/* Medicine Information */}
        <View style={styles.card}>
          <AppText style={styles.cardTitle}>
            Medicine Information
          </AppText>

          <View style={styles.serviceDetails}>
            <DetailItem
              label="Medicine ID"
              value={String(medicine.id)}
            />
            <DetailItem
              label="Medicine Name"
              value={medicine.name}
            />
            <DetailItem
              label="Generic Name"
              value={medicine.generic_name}
            />
            <DetailItem
              label="Brand Name"
              value={medicine.brand_name}
            />
            <DetailItem
              label="Composition"
              value={medicine.composition}
            />
          </View>
        </View>

        {/* Product Details */}
        <View style={styles.card}>
          <AppText style={styles.cardTitle}>
            Product Details
          </AppText>

          <View style={styles.serviceDetails}>
            <DetailItem
              label="Strength"
              value={medicine.strength}
            />
            <DetailItem
              label="Dosage Form"
              value={medicine.dosage_form}
            />
            <DetailItem
              label="Manufacturer"
              value={medicine.manufacturer}
            />
          </View>
        </View>

        {/* Additional Information */}
        <View style={styles.card}>
          <AppText style={styles.cardTitle}>
            Additional Information
          </AppText>

          <View style={styles.serviceDetails}>
            <DetailItem
              label="Description"
              value={medicine.description}
            />
            <DetailItem
              label="Default Instructions"
              value={medicine.default_instructions}
            />
          </View>
        </View>

        {/* Status */}
        <View style={styles.card}>
          <AppText style={styles.cardTitle}>
            Catalogue Status
          </AppText>

          <View style={styles.serviceDetails}>
            <View style={styles.serviceDetailItem}>
              <AppText variant="muted">Current Status</AppText>
              <StatusBadge
                label={medicine.is_active ? 'Active' : 'Inactive'}
                variant={medicine.is_active ? 'success' : 'danger'}
              />
            </View>

            {medicine.created_at ? (
              <DetailItem
                label="Created"
                value={new Date(medicine.created_at).toLocaleString()}
              />
            ) : null}

            {medicine.updated_at ? (
              <DetailItem
                label="Last Updated"
                value={new Date(medicine.updated_at).toLocaleString()}
              />
            ) : null}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/(superadmin)/medicines/[id]/edit',
                params: { id: String(medicine.id) },
              })
            }
            accessibilityRole="button"
            style={[styles.actionButton, styles.replyButton]}
          >
            <AppText style={styles.actionButtonText}>
              Edit Medicine
            </AppText>
          </Pressable>

          <Pressable
            onPress={handleToggleStatus}
            disabled={updatingStatus}
            accessibilityRole="button"
            style={[
              styles.actionButton,
              medicine.is_active
                ? styles.deleteButton
                : styles.editButton,
              updatingStatus && styles.disabledButton,
            ]}
          >
            {updatingStatus ? (
              <ActivityIndicator color={colors.badgeText} />
            ) : (
              <AppText style={styles.actionButtonText}>
                {medicine.is_active
                  ? 'Deactivate Medicine'
                  : 'Activate Medicine'}
              </AppText>
            )}
          </Pressable>
        </View>

        <Pressable
          onPress={() => router.replace('/medicines')}
          accessibilityRole="button"
          style={[styles.actionButton, styles.editButton]}
        >
          <AppText style={styles.actionButtonText}>
            Back to Medicines
          </AppText>
        </Pressable>
      </ScrollView>
    </View>
  );
}
