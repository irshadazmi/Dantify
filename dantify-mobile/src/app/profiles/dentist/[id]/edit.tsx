import React from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import DentistForm, { type DentistFormValues } from '@/components/forms/dentist-form';
import dentistService from '@/services/dentist-service';
import type { Dentist, DentistUpdatePayload } from '@/types/dentist';
import { AppText } from '@/components/ui/app-text';
import { useAppColors } from '@/hooks/use-app-colors';
import { useStyles } from '@/styles/styles';

function toInitialValues(dentist: Dentist): Partial<DentistFormValues> {
  return {
    name: dentist.name ?? '', gender: dentist.gender ?? '',
    address: dentist.address ?? '', city: dentist.city ?? '',
    state: dentist.state ?? '', country: dentist.country ?? '',
    postal_code: dentist.postal_code ?? '', phone: dentist.phone ?? '',
    email: dentist.email ?? '', specialization: dentist.specialization ?? '',
    profilePhoto: null, removeProfilePhoto: false,
  };
}

function toPayload(values: DentistFormValues): DentistUpdatePayload {
  return {
    name: values.name.trim(), gender: values.gender || null,
    address: values.address.trim(), city: values.city.trim(),
    state: values.state.trim(), country: values.country.trim(),
    postal_code: values.postal_code.trim(), phone: values.phone.trim(),
    email: values.email.trim().toLowerCase(),
    specialization: values.specialization.trim(),
    profile_photo: values.profilePhoto,
    remove_profile_photo: values.removeProfilePhoto,
  };
}

export default function EditDentistProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dentistId = Number(id);
  const styles = useStyles();
  const colors = useAppColors();
  const router = useRouter();
  const [dentist, setDentist] = React.useState<Dentist | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!Number.isInteger(dentistId) || dentistId <= 0) {
        setError('Invalid dentist profile.');
        setLoading(false);
        return;
      }
      try {
        const result = await dentistService.getById(dentistId);
        if (!cancelled) setDentist(result);
      } catch (err: any) {
        if (!cancelled) setError(err?.response?.data?.message || 'Unable to load dentist profile.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [dentistId]);

  const handleSubmit = async (values: DentistFormValues) => {
    if (!dentist || saving) return;
    setSaving(true);
    setError(null);
    try {
      await dentistService.update(dentist.id, toPayload(values));
      router.replace('/profiles/dentist' as never);
    } catch (err: any) {
      const data = err?.response?.data;
      const validationErrors = data?.errors ? Object.values(data.errors).flat().join('\n') : null;
      setError(validationErrors || data?.message || 'Unable to update dentist profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={[styles.container, { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }]}>
    <ActivityIndicator size="large" color={colors.primary} />
    <AppText style={{ marginTop: 12 }}>Loading dentist profile...</AppText>
  </View>;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 10, paddingBottom: 48, flexGrow: 1 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets>
      <AppText style={styles.title}>Edit Dentist Profile</AppText>
      <AppText style={[styles.subtitle, { color: colors.textMuted, marginBottom: 20 }]}>Update your professional details and profile photo.</AppText>
      {error ? <AppText variant="error" style={{ marginBottom: 12 }}>{error}</AppText> : null}
      {dentist ? (
        <DentistForm
          key={dentist.id}
          user_id={dentist.user_id}
          initialValues={toInitialValues(dentist)}
          initialPhotoUrl={dentist.profile_photo_url}
          onChange={() => undefined}
          onSubmit={handleSubmit}
          saving={saving}
        />
      ) : null}
    </ScrollView>
  );
}
