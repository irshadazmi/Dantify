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
  getDentalAdvices,
  updateDentalAdviceStatus,
} from '@/services/dental-advice-service';

import type { DentalAdvice } from '@/types/dental-advice';

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

export default function DentalAdvicesScreen() {
  const router = useRouter();
  const styles = useStyles();
  const colors = useAppColors();

  const { user, isLoading: authLoading } = useAuth();

  const roleName =
    typeof user?.role === 'string'
      ? user.role
      : user?.role?.name;

  const isSuperAdmin = roleName === 'superadmin';

  const [advices, setAdvices] = useState<DentalAdvice[]>([]);
  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadAdvices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getDentalAdvices({
        search: search.trim() || undefined,
        page: 1,
        per_page: 50,
      });

      setAdvices(result.data);
    } catch (err) {
      setError(getErrorMessage(err));
      setAdvices([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (!authLoading && isSuperAdmin) {
      const timeout = setTimeout(() => {
        void loadAdvices();
      }, 350);

      return () => clearTimeout(timeout);
    }
  }, [authLoading, isSuperAdmin, loadAdvices]);

  const handleStatusChange = (advice: DentalAdvice) => {
    if (updatingId !== null) return;

    const nextStatus = !advice.is_active;

    Alert.alert(
      `${nextStatus ? 'Activate' : 'Deactivate'} dental advice`,
      `Are you sure you want to ${
        nextStatus ? 'activate' : 'deactivate'
      } "${advice.name}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: nextStatus ? 'Activate' : 'Deactivate',
          style: nextStatus ? 'default' : 'destructive',
          onPress: () => {
            void updateStatus(advice, nextStatus);
          },
        },
      ],
    );
  };

  const updateStatus = async (
    advice: DentalAdvice,
    isActive: boolean,
  ) => {
    try {
      setUpdatingId(advice.id);

      await updateDentalAdviceStatus(advice.id, isActive);

      setAdvices((current) =>
        current.map((item) =>
          item.id === advice.id
            ? { ...item, is_active: isActive }
            : item,
        ),
      );
    } catch (err) {
      Alert.alert(
        'Unable to update dental advice status',
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
          <ActivityIndicator size="large" color={colors.primary} />
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
            Only Super Admin can manage the dental advice catalogue.
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
            <AppText variant="title">Dental Advice</AppText>

            <AppText variant="muted">
              Manage the common dental advice catalogue used for
              prescriptions.
            </AppText>
          </View>

          <Pressable
            onPress={() => router.push('/dental-advices/create')}
            accessibilityRole="button"
            accessibilityLabel="Add dental advice"
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
          placeholder="Search dental advice..."
          autoCapitalize="none"
          returnKeyType="search"
        />

        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={colors.primary} />
            <AppText variant="muted">
              Loading dental advice...
            </AppText>
          </View>
        ) : error ? (
          <View style={styles.emptyState}>
            <AppText variant="title">
              Unable to load dental advice
            </AppText>
            <AppText variant="error">{error}</AppText>

            <Pressable
              onPress={() => void loadAdvices()}
              accessibilityRole="button"
              style={[styles.actionButton, styles.replyButton]}
            >
              <AppText style={styles.actionButtonText}>
                Retry
              </AppText>
            </Pressable>
          </View>
        ) : advices.length === 0 ? (
          <View style={styles.emptyState}>
            <AppText variant="title">
              No dental advice found
            </AppText>

            <AppText variant="muted">
              {search.trim()
                ? 'Try another search term.'
                : 'Add your first dental advice item to the catalogue.'}
            </AppText>

            {!search.trim() && (
              <Pressable
                onPress={() =>
                  router.push('/dental-advices/create')
                }
                accessibilityRole="button"
                style={[styles.actionButton, styles.replyButton]}
              >
                <AppText style={styles.actionButtonText}>
                  Add Dental Advice
                </AppText>
              </Pressable>
            )}
          </View>
        ) : (
          <>
            <AppText variant="muted">
              {advices.length} item
              {advices.length === 1 ? '' : 's'} displayed
            </AppText>

            {advices.map((advice) => {
              const isUpdating = updatingId === advice.id;

              return (
                <View key={advice.id} style={styles.card}>
                  <Pressable
                    onPress={() =>
                      router.push(`/dental-advices/${advice.id}`)
                    }
                    accessibilityRole="button"
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.screenHeaderContent}>
                        <AppText style={styles.cardTitle}>
                          {advice.name}
                        </AppText>

                        {!!advice.description && (
                          <AppText variant="muted">
                            {advice.description}
                          </AppText>
                        )}
                      </View>

                      <StatusBadge
                        label={
                          advice.is_active ? 'Active' : 'Inactive'
                        }
                        variant={
                          advice.is_active ? 'success' : 'danger'
                        }
                      />
                    </View>

                    {!!advice.default_instructions && (
                      <View style={styles.serviceDetails}>
                        <View style={styles.serviceDetailItem}>
                          <AppText variant="muted">
                            Default Instructions
                          </AppText>
                          <AppText variant="label">
                            {advice.default_instructions}
                          </AppText>
                        </View>
                      </View>
                    )}
                  </Pressable>

                  <View style={styles.actionsRow}>
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname:
                            '/(superadmin)/dental-advices/[id]/edit',
                          params: { id: String(advice.id) },
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
                      disabled={isUpdating || updatingId !== null}
                      onPress={() => handleStatusChange(advice)}
                      accessibilityRole="button"
                      style={[
                        styles.actionButton,
                        advice.is_active
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
                          {advice.is_active
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