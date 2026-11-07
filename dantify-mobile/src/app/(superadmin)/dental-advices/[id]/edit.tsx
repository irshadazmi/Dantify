import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppText } from '@/components/ui/app-text';
import DentalAdviceForm from '@/components/forms/dental-advice-form';

import { useAuth } from '@/contexts/auth-context';
import { useStyles } from '@/styles/styles';
import { useAppColors } from '@/hooks/use-app-colors';

import {
  getDentalAdvice,
  updateDentalAdvice,
} from '@/services/dental-advice-service';

import type {
  DentalAdvice,
  UpdateDentalAdvicePayload,
} from '@/types/dental-advice';

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

export default function EditDentalAdviceScreen() {
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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading || !isSuperAdmin || !validId) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const loadAdvice = async () => {
      try {
        setLoading(true);

        const result = await getDentalAdvice(adviceId);

        if (mounted) {
          setAdvice(result);
        }
      } catch (error) {
        if (mounted) {
          Alert.alert(
            'Unable to load dental advice',
            getErrorMessage(error),
            [
              {
                text: 'OK',
                onPress: () => router.replace('/dental-advices'),
              },
            ],
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadAdvice();

    return () => {
      mounted = false;
    };
  }, [authLoading, isSuperAdmin, validId, adviceId, router]);

  const handleUpdate = async (
    payload: UpdateDentalAdvicePayload,
  ) => {
    if (saving) return;

    try {
      setSaving(true);

      const updated = await updateDentalAdvice(adviceId, payload);
      setAdvice(updated);

      Alert.alert(
        'Dental Advice updated',
        `"${updated.name}" has been updated successfully.`,
        [
          {
            text: 'OK',
            onPress: () =>
              router.replace(`/dental-advices/${updated.id}`),
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        'Unable to update dental advice',
        getErrorMessage(error),
      );
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
          Only Super Admin can manage the dental advice catalogue.
        </AppText>
      </View>
    );
  }

  if (!validId || !advice) {
    return (
      <View style={styles.container}>
        <AppText variant="title">Dental Advice not found</AppText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DentalAdviceForm
        initialValues={advice}
        submitLabel="Save Changes"
        saving={saving}
        onSubmit={handleUpdate}
        onCancel={() => router.back()}
      />
    </View>
  );
}