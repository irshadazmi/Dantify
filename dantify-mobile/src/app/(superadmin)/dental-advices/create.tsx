import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { AppText } from '@/components/ui/app-text';
import DentalAdviceForm from '@/components/forms/dental-advice-form';

import { useAuth } from '@/contexts/auth-context';
import { useStyles } from '@/styles/styles';
import { useAppColors } from '@/hooks/use-app-colors';

import { createDentalAdvice } from '@/services/dental-advice-service';

import type { CreateDentalAdvicePayload } from '@/types/dental-advice';

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

export default function CreateDentalAdviceScreen() {
  const router = useRouter();
  const styles = useStyles();
  const colors = useAppColors();

  const { user, isLoading: authLoading } = useAuth();

  const roleName =
    typeof user?.role === 'string'
      ? user.role
      : user?.role?.name;

  const isSuperAdmin = roleName === 'superadmin';

  const [saving, setSaving] = useState(false);

  const handleCreate = async (payload: CreateDentalAdvicePayload) => {
    if (saving) return;

    try {
      setSaving(true);

      const advice = await createDentalAdvice(payload);

      Alert.alert(
        'Dental Advice created',
        `"${advice.name}" has been added to the dental advice catalogue.`,
        [
          {
            text: 'OK',
            onPress: () =>
              router.replace(`/dental-advices/${advice.id}`),
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        'Unable to create dental advice',
        getErrorMessage(error),
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
        <AppText variant="title">Access restricted</AppText>
        <AppText variant="muted">
          Only Super Admin can manage the dental advice catalogue.
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DentalAdviceForm
        submitLabel="Create Dental Advice"
        saving={saving}
        onSubmit={handleCreate}
        onCancel={() => router.back()}
      />
    </View>
  );
}