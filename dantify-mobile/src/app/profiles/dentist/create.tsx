import React, { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';

import DentistForm, { type DentistFormValues } from '@/components/forms/dentist-form';
import dentistService from '@/services/dentist-service';
import type { DentistCreatePayload } from '@/types/dentist';
import { AppText } from '@/components/ui/app-text';
import { useAppColors } from '@/hooks/use-app-colors';
import { useStyles } from '@/styles/styles';

function toPayload(values: DentistFormValues): DentistCreatePayload {
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
    profile_photo: values.profilePhoto,
  };
}

export default function CreateDentistProfile() {
  const styles = useStyles();
  const colors = useAppColors();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (values: DentistFormValues) => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await dentistService.create(toPayload(values));
      router.replace('/profiles/dentist' as never);
    } catch (err: any) {
      const data = err?.response?.data;
      const validationErrors = data?.errors ? Object.values(data.errors).flat().join('\n') : null;
      setError(validationErrors || data?.message || 'Unable to create your dentist profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [router, saving]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 10, paddingBottom: 48, flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets
    >
      <AppText style={styles.title}>Create Dentist Profile</AppText>
      <AppText style={[styles.subtitle, { color: colors.textMuted, marginBottom: 20 }]}>Add your professional details and profile photo.</AppText>
      {error ? <AppText variant="error" style={{ marginBottom: 12 }}>{error}</AppText> : null}
      <DentistForm onChange={() => undefined} onSubmit={handleSubmit} saving={saving} />
    </ScrollView>
  );
}
