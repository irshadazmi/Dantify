import React from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import PatientForm, { type PatientFormValues } from '@/components/forms/patient-form';
import patientService from '@/services/patient-service';
import type { Patient, PatientUpdatePayload } from '@/types/patient';
import { AppText } from '@/components/ui/app-text';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useAppColors } from '@/hooks/use-app-colors';
import { useStyles } from '@/styles/styles';

function toInitialValues(patient: Patient): Partial<PatientFormValues> {
  return {
    name: patient.name ?? '',
    gender: patient.gender ?? '',
    dob: patient.dob?.slice(0, 10) ?? '',
    address: patient.address ?? '',
    city: patient.city ?? '',
    state: patient.state ?? '',
    country: patient.country ?? '',
    postal_code: patient.postal_code ?? '',
    phone: patient.phone ?? '',
    email: patient.email ?? '',
    profilePhoto: null,
    removeProfilePhoto: false,
  };
}

function toPayload(values: PatientFormValues): PatientUpdatePayload {
  return {
    name: values.name.trim(),
    gender: values.gender.trim(),
    dob: values.dob.trim(),
    address: values.address.trim(),
    city: values.city.trim(),
    state: values.state.trim(),
    country: values.country.trim(),
    postal_code: values.postal_code.trim(),
    phone: values.phone.trim() || null,
    email: values.email.trim().toLowerCase() || null,
    profile_photo: values.profilePhoto,
    remove_profile_photo: values.removeProfilePhoto,
  };
}

export default function EditPatientProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const patientId = Number(id);
  const styles = useStyles();
  const colors = useAppColors();
  const router = useRouter();

  const [patient, setPatient] = React.useState<Patient | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!Number.isInteger(patientId) || patientId <= 0) {
        setError('Invalid patient profile.');
        setLoading(false);
        return;
      }

      try {
        const result = await patientService.getById(patientId);
        if (!cancelled) setPatient(result);
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              'Unable to load patient profile.',
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
  }, [patientId]);

  const handleSubmit = async (values: PatientFormValues) => {
    if (!patient || saving) return;

    setSaving(true);
    setError(null);

    try {
      await patientService.update(patient.id, toPayload(values));
      router.replace('/profiles/patient' as never);
    } catch (err: any) {
      const data = err?.response?.data;
      const validationErrors = data?.errors
        ? Object.values(data.errors).flat().join('\n')
        : null;

      setError(
        validationErrors ||
          data?.message ||
          'Unable to update patient profile.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.profileLoading}>
        <ActivityIndicator size="large" color={colors.primary} />
        <AppText>Loading patient profile...</AppText>
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
        title="Edit Patient Profile"
        subtitle="Update your professional details and profile photo."
        showBack
        onBack={() => router.back()}
      />

      {error ? (
        <AppText variant="error" style={styles.profileFormError}>
          {error}
        </AppText>
      ) : null}

      {patient ? (
        <PatientForm
          key={patient.id}
          user_id={patient.user_id}
          initialValues={toInitialValues(patient)}
          initialPhotoUrl={patient.profile_photo_url}
          onChange={() => undefined}
          onSubmit={handleSubmit}
          saving={saving}
        />
      ) : (
        <View style={styles.emptyState}>
          <AppText variant="error">
            {error || 'Patient profile could not be loaded.'}
          </AppText>
        </View>
      )}
    </ScrollView>
  );
}
