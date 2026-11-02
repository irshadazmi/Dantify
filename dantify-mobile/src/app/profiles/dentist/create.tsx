
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import DentistForm, {
  type DentistFormValues,
} from '@/components/forms/dentist-form';

import dentistService from '@/services/dentist-service';

import type {
  Dentist,
  DentistCreatePayload,
  DentistUpdatePayload,
} from '@/types/dentist';

import { AppText } from '@/components/ui/app-text';
import { useAppColors } from '@/hooks/use-app-colors';
import { useStyles } from '@/styles/styles';

function toFormValues(
  dentist: Dentist,
): Partial<DentistFormValues> {
  return {
    name: dentist.name ?? '',
    gender: dentist.gender ?? '',
    address: dentist.address ?? '',
    city: dentist.city ?? '',
    state: dentist.state ?? '',
    country: dentist.country ?? '',
    postal_code: dentist.postal_code ?? '',
    phone: dentist.phone ?? '',
    email: dentist.email ?? '',
    specialization: dentist.specialization ?? '',
  };
}

function toPayload(
  values: DentistFormValues,
): DentistCreatePayload {
  return {
    name: values.name.trim(),
    gender: values.gender || null,
    address: values.address.trim(),
    city: values.city.trim(),
    state: values.state.trim(),
    country: values.country.trim(),
    postal_code: values.postal_code.trim(),
    phone: values.phone.trim(),
    email: values.email.trim().toLowerCase(),
    specialization: values.specialization.trim(),
  };
}

export default function CreateDentistProfile() {
  const styles = useStyles();
  const COLORS = useAppColors();
  const router = useRouter();

  const [dentist, setDentist] = useState<Dentist | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formValues, setFormValues] =
    useState<Partial<DentistFormValues>>({});

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        setLoading(true);
        setError(null);

        const result = await dentistService.getMyProfile();

        if (cancelled) return;

        const existingDentist = result.data ?? null;

        setDentist(existingDentist);
        setFormValues(
          existingDentist ? toFormValues(existingDentist) : {},
        );
      } catch (err: any) {
        if (cancelled) return;

        if (
          err?.response?.status === 404 &&
          err?.response?.data?.next_step === 'create_profile'
        ) {
          setDentist(null);
          setFormValues({});
        } else {
          setError(
            err?.response?.data?.message ??
            'Unable to load your dentist profile. Please try again.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleFormChange = useCallback(
    (values: DentistFormValues) => {
      setFormValues(values);
    },
    [],
  );

  const handleSubmit = useCallback(
    async (values: DentistFormValues) => {
      if (saving) return;

      setSaving(true);
      setError(null);

      try {
        const payload = toPayload(values);

        const savedDentist = dentist
          ? await dentistService.update(
            dentist.id,
            payload satisfies DentistUpdatePayload,
          )
          : await dentistService.create(payload);

        setDentist(savedDentist);
        setFormValues(toFormValues(savedDentist));

        router.replace('/dashboard' as never);
      } catch (err: any) {
        const responseData = err?.response?.data;

        const validationErrors = responseData?.errors
          ? Object.values(responseData.errors)
            .flat()
            .join('\n')
          : null;

        setError(
          validationErrors ||
          responseData?.message ||
          'Unable to save your dentist profile. Please try again.',
        );
      } finally {
        setSaving(false);
      }
    },
    [dentist, router, saving],
  );

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: COLORS.background,
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />
        <AppText style={{ marginTop: 12 }}>
          Loading dentist profile...
        </AppText>
      </View>
    );
  }

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
      }}
      contentContainerStyle={{
        padding: 10,
        paddingBottom: 48,
        backgroundColor: COLORS.background,
        flexGrow: 1,
      }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets
      showsVerticalScrollIndicator
    >
      <AppText style={styles.title}>
        {dentist
          ? 'Update Dentist Profile'
          : 'Create Dentist Profile'}
      </AppText>

      <AppText
        style={[
          styles.subtitle,
          { color: COLORS.textMuted, marginBottom: 20 },
        ]}
      >
        Enter your professional and contact details to complete
        your dentist registration.
      </AppText>

      {error ? (
        <AppText variant="error" style={{ marginBottom: 12 }}>
          {error}
        </AppText>
      ) : null}

      <DentistForm
        user_id={dentist?.user_id}
        initialValues={formValues}
        onChange={handleFormChange}
        onSubmit={handleSubmit}
        saving={saving}
      />
    </ScrollView>
  );
}
