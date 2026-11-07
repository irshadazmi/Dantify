import React from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import ClinicForm, { type ClinicFormValues } from '@/components/forms/clinic-form';
import clinicService from '@/services/clinic-service';
import type { Clinic, ClinicUpdatePayload } from '@/types/clinic';
import { AppText } from '@/components/ui/app-text';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useAppColors } from '@/hooks/use-app-colors';
import { useStyles } from '@/styles/styles';

function toInitialValues(clinic: Clinic): Partial<ClinicFormValues> {
  return {
    name: clinic.name ?? '',
    address: clinic.address ?? '',
    city: clinic.city ?? '',
    state: clinic.state ?? '',
    country: clinic.country ?? '',
    postal_code: clinic.postal_code ?? '',
    phone: clinic.phone ?? '',
    email: clinic.email ?? '',
    profilePhoto: null,
    removeProfilePhoto: false,
  };
}

function toPayload(values: ClinicFormValues): ClinicUpdatePayload {
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
    remove_profile_photo: values.removeProfilePhoto,
  };
}

export default function EditClinicProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const clinicId = Number(id);
  const styles = useStyles();
  const colors = useAppColors();
  const router = useRouter();

  const [clinic, setClinic] = React.useState<Clinic | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!Number.isInteger(clinicId) || clinicId <= 0) {
        setError('Invalid clinic profile.');
        setLoading(false);
        return;
      }

      try {
        const result = await clinicService.getById(clinicId);
        if (!cancelled) setClinic(result);
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              'Unable to load clinic profile.',
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
  }, [clinicId]);

  const handleSubmit = async (values: ClinicFormValues) => {
    if (!clinic || saving) return;

    setSaving(true);
    setError(null);

    try {
      await clinicService.update(clinic.id, toPayload(values));
      router.replace('/profiles/clinic' as never);
    } catch (err: any) {
      const data = err?.response?.data;
      const validationErrors = data?.errors
        ? Object.values(data.errors).flat().join('\n')
        : null;

      setError(
        validationErrors ||
          data?.message ||
          'Unable to update clinic profile.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.profileLoading}>
        <ActivityIndicator size="large" color={colors.primary} />
        <AppText>Loading clinic profile...</AppText>
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
        title="Edit Clinic Profile"
        subtitle="Update your professional details and profile photo."
        showBack
        onBack={() => router.back()}
      />

      {error ? (
        <AppText variant="error" style={styles.profileFormError}>
          {error}
        </AppText>
      ) : null}

      {clinic ? (
        <ClinicForm
          key={clinic.id}
          user_id={clinic.user_id}
          initialValues={toInitialValues(clinic)}
          initialPhotoUrl={clinic.profile_photo_url}
          onChange={() => undefined}
          onSubmit={handleSubmit}
          saving={saving}
        />
      ) : (
        <View style={styles.emptyState}>
          <AppText variant="error">
            {error || 'Clinic profile could not be loaded.'}
          </AppText>
        </View>
      )}
    </ScrollView>
  );
}
