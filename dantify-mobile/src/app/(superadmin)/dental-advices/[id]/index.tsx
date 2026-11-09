import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

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
  getDentalAdvice,
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

export default function DentalAdviceDetailScreen() {
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

  const adviceId = Number(id);
  const validId =
    Number.isInteger(adviceId) && adviceId > 0;

  const [advice, setAdvice] = useState<DentalAdvice | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadAdvice = useCallback(async () => {
    if (!validId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const result = await getDentalAdvice(adviceId);
      setAdvice(result);
    } catch (error) {
      showAppDialog(
        'Unable to load dental advice',
        getErrorMessage(error),
        [
          {
            text: 'OK',
            onPress: () => router.replace('/dental-advices'),
          },
        ],
      );
    } finally {
      setLoading(false);
    }
  }, [validId, adviceId, router]);

  useEffect(() => {
    if (!authLoading && isSuperAdmin && validId) {
      void loadAdvice();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, isSuperAdmin, validId, loadAdvice]);

  const handleToggleStatus = () => {
    if (!advice || updatingStatus) return;

    const nextStatus = !advice.is_active;

    showAppDialog(
      `${nextStatus ? 'Activate' : 'Deactivate'} Dental Advice`,
      `Are you sure you want to ${
        nextStatus ? 'activate' : 'deactivate'
      } "${advice.name}"?`,
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
    if (!advice || updatingStatus) return;

    try {
      setUpdatingStatus(true);

      const updated = await updateDentalAdviceStatus(
        advice.id,
        nextStatus,
      );

      setAdvice(updated);

      showAppDialog(
        'Status updated',
        `Dental advice is now ${
          nextStatus ? 'active' : 'inactive'
        }.`,
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
          Only Super Admin can view and manage the dental advice catalogue.
        </AppText>
      </View>
    );
  }

  if (!validId || !advice) {
    return (
      <View style={styles.container}>
        <AppText variant="title">Dental Advice not found</AppText>
        <AppText variant="muted">
          The requested dental advice could not be found.
        </AppText>

        <Pressable
          onPress={() => router.replace('/dental-advices')}
          style={[styles.actionButton, styles.editButton]}
        >
          <AppText style={styles.actionButtonText}>
            Back to Dental Advice
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
            <AppText variant="title">{advice.name}</AppText>
            <AppText variant="muted">
              Master Dental Advice Catalogue
            </AppText>
          </View>

          <StatusBadge
            label={advice.is_active ? 'Active' : 'Inactive'}
            variant={advice.is_active ? 'success' : 'danger'}
          />
        </View>

        <View style={styles.card}>
          <AppText style={styles.cardTitle}>
            Dental Advice Information
          </AppText>

          <View style={styles.serviceDetails}>
            <DetailItem
              label="Advice ID"
              value={String(advice.id)}
            />
            <DetailItem
              label="Advice Name"
              value={advice.name}
            />
            <DetailItem
              label="Description"
              value={advice.description}
            />
          </View>
        </View>

        <View style={styles.card}>
          <AppText style={styles.cardTitle}>
            Default Instructions
          </AppText>

          <View style={styles.serviceDetails}>
            <DetailItem
              label="Instructions"
              value={advice.default_instructions}
            />
          </View>
        </View>

        <View style={styles.card}>
          <AppText style={styles.cardTitle}>
            Catalogue Status
          </AppText>

          <View style={styles.serviceDetails}>
            <View style={styles.serviceDetailItem}>
              <AppText variant="muted">Current Status</AppText>
              <StatusBadge
                label={advice.is_active ? 'Active' : 'Inactive'}
                variant={advice.is_active ? 'success' : 'danger'}
              />
            </View>

            {advice.created_at ? (
              <DetailItem
                label="Created"
                value={new Date(advice.created_at).toLocaleString()}
              />
            ) : null}

            {advice.updated_at ? (
              <DetailItem
                label="Last Updated"
                value={new Date(advice.updated_at).toLocaleString()}
              />
            ) : null}
          </View>
        </View>

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
            style={[styles.actionButton, styles.replyButton]}
          >
            <AppText style={styles.actionButtonText}>
              Edit Dental Advice
            </AppText>
          </Pressable>

          <Pressable
            onPress={handleToggleStatus}
            disabled={updatingStatus}
            accessibilityRole="button"
            style={[
              styles.actionButton,
              advice.is_active
                ? styles.deleteButton
                : styles.editButton,
              updatingStatus && styles.disabledButton,
            ]}
          >
            {updatingStatus ? (
              <ActivityIndicator color={colors.badgeText} />
            ) : (
              <AppText style={styles.actionButtonText}>
                {advice.is_active
                  ? 'Deactivate Dental Advice'
                  : 'Activate Dental Advice'}
              </AppText>
            )}
          </Pressable>
        </View>

        <Pressable
          onPress={() => router.replace('/dental-advices')}
          accessibilityRole="button"
          style={[styles.actionButton, styles.editButton]}
        >
          <AppText style={styles.actionButtonText}>
            Back to Dental Advice
          </AppText>
        </Pressable>
      </ScrollView>
    </View>
  );
}