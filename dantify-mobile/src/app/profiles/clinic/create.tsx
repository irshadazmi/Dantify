
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import ClinicForm, {
  type ClinicFormValues,
} from '@/components/forms/clinic-form';

import clinicService from '@/services/clinic-service';

import type {
  Clinic,
  ClinicCreatePayload,
  ClinicUpdatePayload,
} from '@/types/clinic';

import { AppText } from '@/components/ui/app-text';
import { useAppColors } from '@/hooks/use-app-colors';
import { useStyles } from '@/styles/styles';

function toFormValues(
  clinic: Clinic,
): Partial<ClinicFormValues> {
  return {
    name: clinic.name ?? '',
    address: clinic.address ?? '',
    city: clinic.city ?? '',
    state: clinic.state ?? '',
    country: clinic.country ?? '',
    postal_code: clinic.postal_code ?? '',
    phone: clinic.phone ?? '',
    email: clinic.email ?? '',
  };
}

function toPayload(
  values: ClinicFormValues,
): Omit<ClinicCreatePayload, 'user_id'> {
  return {
    name: values.name.trim(),
    address: values.address.trim(),
    city: values.city.trim(),
    state: values.state.trim(),
    country: values.country.trim(),
    postal_code: values.postal_code.trim(),
    phone: values.phone.trim(),
    email: values.email.trim().toLowerCase(),
  };
}

export default function CreateClinicProfile() {
  const styles = useStyles();
  const COLORS = useAppColors();
  const router = useRouter();

  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formValues, setFormValues] =
    useState<Partial<ClinicFormValues>>({});

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        setLoading(true);
        setError(null);

        const result = await clinicService.getMyProfile();

        if (cancelled) return;

        const existingClinic = result.data ?? null;

        setClinic(existingClinic);
        setFormValues(
          existingClinic ? toFormValues(existingClinic) : {},
        );
      } catch (err: any) {
        if (cancelled) return;

        // A missing profile is an expected onboarding state.
        if (
          err?.response?.status === 404 &&
          err?.response?.data?.next_step === 'create_profile'
        ) {
          setClinic(null);
          setFormValues({});
        } else {
          setError(
            err?.response?.data?.message ??
              'Unable to load your clinic profile. Please try again.',
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
    (values: ClinicFormValues) => {
      setFormValues(values);
    },
    [],
  );

  const handleSubmit = useCallback(
    async (values: ClinicFormValues) => {
      if (saving) return;

      setSaving(true);
      setError(null);

      try {
        const payload = toPayload(values);

        const savedClinic = clinic
          ? await clinicService.update(
              clinic.id,
              payload satisfies ClinicUpdatePayload,
            )
          : await clinicService.create(payload);

        setClinic(savedClinic);
        setFormValues(toFormValues(savedClinic));

        router.replace('/dashboard' as never);
      } catch (err: any) {
        setError(
          err?.response?.data?.message ??
            'Unable to save your clinic profile. Please try again.',
        );
      } finally {
        setSaving(false);
      }
    },
    [clinic, router, saving],
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
          Loading clinic profile...
        </AppText>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: COLORS.background }}
      contentContainerStyle={[
        styles.container,
        { paddingBottom: 24 },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <AppText style={styles.title}>
        {clinic ? 'Update Clinic Profile' : 'Create Clinic Profile'}
      </AppText>

      <AppText
        style={[
          styles.subtitle,
          { color: COLORS.textMuted, marginBottom: 20 },
        ]}
      >
        Enter your clinic details to complete your registration.
      </AppText>

      <ClinicForm
        user_id={clinic?.user_id}
        initialValues={formValues}
        onChange={handleFormChange}
        onSubmit={handleSubmit}
        saving={saving}
      />
    </ScrollView>
  );
}
