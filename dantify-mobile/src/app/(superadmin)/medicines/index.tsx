
import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  View,
} from 'react-native';

import { useRouter } from 'expo-router';

import { AppText } from '@/components/ui/app-text';
import { AppInput } from '@/components/ui/app-input';
import { StatusBadge } from '@/components/ui/status-badge';

import { useAuth } from '@/contexts/auth-context';
import { useStyles } from '@/styles/styles';
import { useAppColors } from '@/hooks/use-app-colors';

import {
  getMedicines,
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

export default function MedicinesScreen() {
  const router = useRouter();
  const styles = useStyles();
  const colors = useAppColors();

  const { user, isLoading: authLoading } = useAuth();

  const roleName =
    typeof user?.role === 'string'
      ? user.role
      : user?.role?.name;

  const isSuperAdmin = roleName === 'superadmin';

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadMedicines = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getMedicines({
        search: search.trim() || undefined,
        page: 1,
        per_page: 50,
      });

      setMedicines(result.data);
    } catch (err) {
      setError(getErrorMessage(err));
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (!authLoading && isSuperAdmin) {
      const timeout = setTimeout(() => {
        void loadMedicines();
      }, 350);

      return () => clearTimeout(timeout);
    }
  }, [authLoading, isSuperAdmin, loadMedicines]);

  const handleStatusChange = (medicine: Medicine) => {
    if (updatingId !== null) return;

    const nextStatus = !medicine.is_active;

    Alert.alert(
      `${nextStatus ? 'Activate' : 'Deactivate'} medicine`,
      `Are you sure you want to ${
        nextStatus ? 'activate' : 'deactivate'
      } "${medicine.name}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: nextStatus ? 'Activate' : 'Deactivate',
          style: nextStatus ? 'default' : 'destructive',
          onPress: () => {
            void updateStatus(medicine, nextStatus);
          },
        },
      ],
    );
  };

  const updateStatus = async (
    medicine: Medicine,
    isActive: boolean,
  ) => {
    try {
      setUpdatingId(medicine.id);

      await updateMedicineStatus(medicine.id, isActive);

      setMedicines((current) =>
        current.map((item) =>
          item.id === medicine.id
            ? { ...item, is_active: isActive }
            : item,
        ),
      );
    } catch (err) {
      Alert.alert(
        'Unable to update medicine status',
        getErrorMessage(err),
      );
    } finally {
      setUpdatingId(null);
    }
  };

  if (authLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />
        </View>
      </View>
    );
  }

  if (!isSuperAdmin) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <AppText variant="title">Access restricted</AppText>
          <AppText variant="muted">
            Only Super Admin can manage the medicine catalogue.
          </AppText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.screenHeader}>
          <View style={styles.screenHeaderContent}>
            <AppText variant="title">Medicines</AppText>

            <AppText variant="muted">
              Manage the common medicine catalogue used for
              prescriptions.
            </AppText>
          </View>

          <Pressable
            onPress={() => router.push('/medicines/create')}
            accessibilityRole="button"
            accessibilityLabel="Add medicine"
            style={styles.smallButton}
          >
            <AppText style={styles.smallButtonText}>
              + Add
            </AppText>
          </Pressable>
        </View>

        <AppInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search name, generic, brand or composition..."
          autoCapitalize="none"
          returnKeyType="search"
        />

        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator
              size="large"
              color={colors.primary}
            />
            <AppText variant="muted">
              Loading medicines...
            </AppText>
          </View>
        ) : error ? (
          <View style={styles.emptyState}>
            <AppText variant="title">
              Unable to load medicines
            </AppText>
            <AppText variant="error">{error}</AppText>

            <Pressable
              onPress={() => void loadMedicines()}
              accessibilityRole="button"
              style={[styles.actionButton, styles.replyButton]}
            >
              <AppText style={styles.actionButtonText}>
                Retry
              </AppText>
            </Pressable>
          </View>
        ) : medicines.length === 0 ? (
          <View style={styles.emptyState}>
            <AppText variant="title">
              No medicines found
            </AppText>

            <AppText variant="muted">
              {search.trim()
                ? 'Try another search term.'
                : 'Add your first medicine to the catalogue.'}
            </AppText>

            {!search.trim() && (
              <Pressable
                onPress={() => router.push('/medicines/create')}
                accessibilityRole="button"
                style={[styles.actionButton, styles.replyButton]}
              >
                <AppText style={styles.actionButtonText}>
                  Add Medicine
                </AppText>
              </Pressable>
            )}
          </View>
        ) : (
          <>
            <AppText variant="muted">
              {medicines.length} medicine
              {medicines.length === 1 ? '' : 's'} displayed
            </AppText>

            {medicines.map((medicine) => {
              const isUpdating = updatingId === medicine.id;

              return (
                <View key={medicine.id} style={styles.card}>
                  <Pressable
                    onPress={() =>
                      router.push(`/medicines/${medicine.id}`)
                    }
                    accessibilityRole="button"
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.screenHeaderContent}>
                        <AppText style={styles.cardTitle}>
                          {medicine.name}
                        </AppText>

                        {!!medicine.generic_name && (
                          <AppText variant="muted">
                            Generic: {medicine.generic_name}
                          </AppText>
                        )}

                        {!!medicine.brand_name && (
                          <AppText variant="muted">
                            Brand: {medicine.brand_name}
                          </AppText>
                        )}
                      </View>

                      <StatusBadge
                        label={
                          medicine.is_active ? 'Active' : 'Inactive'
                        }
                        variant={
                          medicine.is_active ? 'success' : 'danger'
                        }
                      />
                    </View>

                    <View style={styles.serviceDetails}>
                      <View style={styles.serviceDetailItem}>
                        <AppText variant="muted">Composition</AppText>
                        <AppText variant="label">
                          {medicine.composition || 'Not specified'}
                        </AppText>
                      </View>

                      <View style={styles.serviceDetailItem}>
                        <AppText variant="muted">Strength / Form</AppText>
                        <AppText variant="label">
                          {[medicine.strength, medicine.dosage_form]
                            .filter(Boolean)
                            .join(' · ') || 'Not specified'}
                        </AppText>
                      </View>
                    </View>
                  </Pressable>

                  <View style={styles.actionsRow}>
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname:
                            '/(superadmin)/medicines/[id]/edit',
                          params: { id: String(medicine.id) },
                        })
                      }
                      accessibilityRole="button"
                      style={[
                        styles.actionButton,
                        styles.editButton,
                      ]}
                    >
                      <AppText style={styles.actionButtonText}>
                        Edit
                      </AppText>
                    </Pressable>

                    <Pressable
                      disabled={
                        isUpdating || updatingId !== null
                      }
                      onPress={() => handleStatusChange(medicine)}
                      accessibilityRole="button"
                      style={[
                        styles.actionButton,
                        medicine.is_active
                          ? styles.deleteButton
                          : styles.replyButton,
                        (isUpdating || updatingId !== null) &&
                          styles.disabledButton,
                      ]}
                    >
                      {isUpdating ? (
                        <ActivityIndicator
                          size="small"
                          color={colors.badgeText}
                        />
                      ) : (
                        <AppText style={styles.actionButtonText}>
                          {medicine.is_active
                            ? 'Deactivate'
                            : 'Activate'}
                        </AppText>
                      )}
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}
