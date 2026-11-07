
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppText } from '@/components/ui/app-text';
import MedicineForm from '@/components/forms/medicine-form';

import { useAuth } from '@/contexts/auth-context';
import { useStyles } from '@/styles/styles';
import { useAppColors } from '@/hooks/use-app-colors';

import {
  getMedicine,
  updateMedicine,
} from '@/services/medicine-service';

import type {
  Medicine,
  UpdateMedicinePayload,
} from '@/types/medicine';

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

export default function EditMedicineScreen() {
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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading || !isSuperAdmin || !validId) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const loadMedicine = async () => {
      try {
        setLoading(true);

        const result = await getMedicine(medicineId);

        if (mounted) {
          setMedicine(result);
        }
      } catch (error) {
        if (mounted) {
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
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadMedicine();

    return () => {
      mounted = false;
    };
  }, [authLoading, isSuperAdmin, validId, medicineId, router]);

  const handleUpdate = async (
    payload: UpdateMedicinePayload,
  ) => {
    if (saving) return;

    try {
      setSaving(true);

      const updated = await updateMedicine(medicineId, payload);
      setMedicine(updated);

      Alert.alert(
        'Medicine updated',
        `"${updated.name}" has been updated successfully.`,
        [
          {
            text: 'OK',
            onPress: () =>
              router.replace(`/medicines/${updated.id}`),
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        'Unable to update medicine',
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
          Only Super Admin can manage the medicine catalogue.
        </AppText>
      </View>
    );
  }

  if (!validId || !medicine) {
    return (
      <View style={styles.container}>
        <AppText variant="title">Medicine not found</AppText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MedicineForm
        initialValues={medicine}
        submitLabel="Save Changes"
        saving={saving}
        onSubmit={handleUpdate}
        onCancel={() => router.back()}
      />
    </View>
  );
}
