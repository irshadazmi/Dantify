import React from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import LaboratoryForm, { type LaboratoryFormValues } from '@/components/forms/laboratory-form';
import laboratoryService from '@/services/laboratory-service';
import type { Laboratory, LaboratoryUpdatePayload } from '@/types/laboratory';
import { AppText } from '@/components/ui/app-text';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useAppColors } from '@/hooks/use-app-colors';
import { useStyles } from '@/styles/styles';

function toInitialValues(laboratory: Laboratory): Partial<LaboratoryFormValues> {
  return {
    name: laboratory.name ?? '',
    contact_person: laboratory.contact_person ?? '',
    address: laboratory.address ?? '',
    city: laboratory.city ?? '',
    state: laboratory.state ?? '',
    country: laboratory.country ?? '',
    postal_code: laboratory.postal_code ?? '',
    phone: laboratory.phone ?? '',
    email: laboratory.email ?? '',
    registration_number: laboratory.registration_number ?? '',
    notes: laboratory.notes ?? '',
    profilePhoto: null,
    removeProfilePhoto: false,
  };
}

function toPayload(values: LaboratoryFormValues): LaboratoryUpdatePayload {
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
    remove_profile_photo: values.removeProfilePhoto,
  };
}

export default function EditLaboratoryProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const laboratoryId = Number(id);
  const styles = useStyles();
  const colors = useAppColors();
  const router = useRouter();

  const [laboratory, setLaboratory] = React.useState<Laboratory | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!Number.isInteger(laboratoryId) || laboratoryId <= 0) {
        setError('Invalid laboratory profile.');
        setLoading(false);
        return;
      }

      try {
        const result = await laboratoryService.getById(laboratoryId);
        if (!cancelled) setLaboratory(result);
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              'Unable to load laboratory profile.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [laboratoryId]);

  const handleSubmit = async (values: LaboratoryFormValues) => {
    if (!laboratory || saving) return;

    setSaving(true);
    setError(null);

    try {
      await laboratoryService.update(laboratory.id, toPayload(values));
      router.replace('/profiles/laboratory' as never);
    } catch (err: any) {
      const data = err?.response?.data;
      const validationErrors = data?.errors
        ? Object.values(data.errors).flat().join('\n')
        : null;

      setError(
        validationErrors ||
          data?.message ||
          'Unable to update laboratory profile.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.profileLoading}>
        <ActivityIndicator size="large" color={colors.primary} />
        <AppText>Loading laboratory profile...</AppText>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.profileScroll}
      contentContainerStyle={styles.profileFormScrollContent}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets
    >
      <ScreenHeader
        title="Edit Laboratory Profile"
        subtitle="Update your professional details and profile photo."
        showBack
        onBack={() => router.back()}
      />

      {error ? (
        <AppText variant="error" style={styles.profileFormError}>
          {error}
        </AppText>
      ) : null}

      {laboratory ? (
        <LaboratoryForm
          key={laboratory.id}
          user_id={laboratory.user_id}
          initialValues={toInitialValues(laboratory)}
          initialPhotoUrl={laboratory.profile_photo_url}
          onChange={() => undefined}
          onSubmit={handleSubmit}
          saving={saving}
        />
      ) : (
        <View style={styles.emptyState}>
          <AppText variant="error">
            {error || 'Laboratory profile could not be loaded.'}
          </AppText>
        </View>
      )}
    </ScrollView>
  );
}
