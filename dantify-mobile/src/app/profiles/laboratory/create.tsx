
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';

import LaboratoryForm, {
  type LaboratoryFormValues,
} from '@/components/forms/laboratory-form';
import { laboratoryService } from '@/services/laboratory-service';
import type {
  Laboratory,
  LaboratoryCreatePayload,
  LaboratoryUpdatePayload,
} from '@/types/laboratory';

import { AppText } from '@/components/ui/app-text';
import { useAppColors } from '@/hooks/use-app-colors';
import { useStyles } from '@/styles/styles';

function toFormValues(
  laboratory: Laboratory,
): Partial<LaboratoryFormValues> {
  return {
    name: laboratory.name ?? '',
    contact_person: laboratory.contact_person ?? '',
    email: laboratory.email ?? '',
    phone: laboratory.phone ?? '',
    address: laboratory.address ?? '',
    city: laboratory.city ?? '',
    state: laboratory.state ?? '',
    country: laboratory.country ?? '',
    postal_code: laboratory.postal_code ?? '',
    registration_number: laboratory.registration_number ?? '',
    notes: laboratory.notes ?? '',
  };
}

function toPayload(
  values: LaboratoryFormValues,
): LaboratoryCreatePayload {
  return {
    name: values.name.trim(),
    contact_person: values.contact_person.trim() || null,
    email: values.email.trim().toLowerCase() || null,
    phone: values.phone.trim() || null,

    // Shared Address fields are strings; optional values remain empty strings.
    address: values.address.trim(),
    city: values.city.trim(),
    state: values.state.trim(),
    country: values.country.trim(),
    postal_code: values.postal_code.trim(),

    registration_number: values.registration_number.trim() || null,
    notes: values.notes.trim() || null,
  };
}

export default function CreateLaboratoryProfile() {
  const styles = useStyles();
  const COLORS = useAppColors();
  const router = useRouter();

  const [laboratory, setLaboratory] = useState<Laboratory | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formValues, setFormValues] =
    useState<Partial<LaboratoryFormValues>>({});

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        setLoading(true);
        setError(null);

        const result = await laboratoryService.getMyProfile();

        if (cancelled) return;

        const existingLaboratory = result.data ?? null;

        setLaboratory(existingLaboratory);
        setFormValues(
          existingLaboratory ? toFormValues(existingLaboratory) : {},
        );
      } catch (err: any) {
        if (cancelled) return;

        if (
          err?.response?.status === 404 &&
          err?.response?.data?.next_step === 'create_profile'
        ) {
          setLaboratory(null);
          setFormValues({});
        } else {
          setError(
            err?.response?.data?.message ??
            'Unable to load your laboratory profile. Please try again.',
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
    (values: LaboratoryFormValues) => {
      setFormValues(values);
    },
    [],
  );

  const handleSubmit = useCallback(
    async (values: LaboratoryFormValues) => {
      if (saving) return;

      setSaving(true);
      setError(null);

      try {
        const payload = toPayload(values);

        // The service methods return Laboratory directly.
        const savedLaboratory = laboratory
          ? await laboratoryService.update(
            laboratory.id,
            payload satisfies LaboratoryUpdatePayload,
          )
          : await laboratoryService.create(payload);

        setLaboratory(savedLaboratory);
        setFormValues(toFormValues(savedLaboratory));

        router.replace('/dashboard' as never);
      } catch (err: any) {
        setError(
          err?.response?.data?.message ??
          'Unable to save your laboratory profile. Please try again.',
        );
      } finally {
        setSaving(false);
      }
    },
    [laboratory, router, saving],
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
        <ActivityIndicator size="large" color={COLORS.primary} />
        <AppText style={{ marginTop: 12 }}>
          Loading laboratory profile...
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
        {laboratory
          ? 'Update Laboratory Profile'
          : 'Create Laboratory Profile'}
      </AppText>

      <AppText
        style={[
          styles.subtitle,
          { color: COLORS.textMuted, marginBottom: 20 },
        ]}
      >
        Enter your laboratory details to complete your registration.
      </AppText>

      {error ? (
        <AppText variant="error" style={{ marginBottom: 12 }}>
          {error}
        </AppText>
      ) : null}

      <LaboratoryForm
        user_id={laboratory?.user_id}
        initialValues={formValues}
        onChange={handleFormChange}
        onSubmit={handleSubmit}
        saving={saving}
      />
    </ScrollView>
  );
}
