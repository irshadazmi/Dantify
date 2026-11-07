import React, { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';

import LaboratoryForm, { type LaboratoryFormValues } from '@/components/forms/laboratory-form';
import laboratoryService from '@/services/laboratory-service';
import type { LaboratoryCreatePayload } from '@/types/laboratory';
import { AppText } from '@/components/ui/app-text';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useStyles } from '@/styles/styles';

function toPayload(values: LaboratoryFormValues): LaboratoryCreatePayload {
  return {
    name: values.name.trim(),
    contact_person: values.contact_person.trim() || null,
    address: values.address.trim(),
    city: values.city.trim(),
    state: values.state.trim(),
    country: values.country.trim(),
    postal_code: values.postal_code.trim(),
    phone: values.phone.trim() || null,
    email: values.email.trim().toLowerCase() || null,
    registration_number: values.registration_number.trim() || null,
    notes: values.notes.trim() || null,
    profile_photo: values.profilePhoto,
  };
}

export default function CreateLaboratoryProfile() {
  const styles = useStyles();
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (values: LaboratoryFormValues) => {
    if (saving) return;

    setSaving(true);
    setError(null);

    try {
      await laboratoryService.create(toPayload(values));
      router.replace('/profiles/dentist' as never);
    } catch (err: any) {
      const data = err?.response?.data;
      const validationErrors = data?.errors
        ? Object.values(data.errors).flat().join('\n')
        : null;

      setError(
        validationErrors ||
          data?.message ||
          'Unable to create your dentist profile. Please try again.',
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
        title="Create Laboratory Profile"
        subtitle="Add your professional details and profile photo."
        showBack
        onBack={() => router.back()}
      />

      {error ? (
        <AppText variant="error" style={styles.profileFormError}>
          {error}
        </AppText>
      ) : null}

      <LaboratoryForm
        onChange={() => undefined}
        onSubmit={handleSubmit}
        saving={saving}
      />
    </ScrollView>
  );
}
