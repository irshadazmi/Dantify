import React, { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';

import ClinicForm, { type ClinicFormValues } from '@/components/forms/clinic-form';
import clinicService from '@/services/clinic-service';
import type { ClinicCreatePayload } from '@/types/clinic';
import { AppText } from '@/components/ui/app-text';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useStyles } from '@/styles/styles';

function toPayload(values: ClinicFormValues): ClinicCreatePayload {
  return {
    name: values.name.trim(),
    address: values.address.trim(),
    city: values.city.trim(),
    state: values.state.trim(),
    country: values.country.trim(),
    postal_code: values.postal_code.trim(),
    phone: values.phone.trim(),
    email: values.email.trim().toLowerCase(),
    profile_photo: values.profilePhoto,
  };
}

export default function CreateClinicProfile() {
  const styles = useStyles();
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (values: ClinicFormValues) => {
    if (saving) return;

    setSaving(true);
    setError(null);

    try {
      await clinicService.create(toPayload(values));
      router.replace('/profiles/clinic' as never);
    } catch (err: any) {
      const data = err?.response?.data;
      const validationErrors = data?.errors
        ? Object.values(data.errors).flat().join('\n')
        : null;

      setError(
        validationErrors ||
          data?.message ||
          'Unable to create your clinic profile. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  }, [router, saving]);

  return (
    <ScrollView
      style={styles.profileScroll}
      contentContainerStyle={styles.profileFormScrollContent}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets
    >
      <ScreenHeader
        title="Create Clinic Profile"
        subtitle="Add your professional details and profile photo."
        showBack
        onBack={() => router.back()}
      />

      {error ? (
        <AppText variant="error" style={styles.profileFormError}>
          {error}
        </AppText>
      ) : null}

      <ClinicForm
        onChange={() => undefined}
        onSubmit={handleSubmit}
        saving={saving}
      />
    </ScrollView>
  );
}
