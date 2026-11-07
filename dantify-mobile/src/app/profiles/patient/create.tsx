import React, { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import PatientForm, { type PatientFormValues } from '@/components/forms/patient-form';
import patientService from '@/services/patient-service';
import type { PatientCreatePayload } from '@/types/patient';
import { AppText } from '@/components/ui/app-text';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useStyles } from '@/styles/styles';

function toPayload(values: PatientFormValues): PatientCreatePayload {
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
  };
}

export default function CreatePatientProfile() {
  const styles = useStyles();
  const router = useRouter();
  const routeParams = useLocalSearchParams<Record<string, string | string[]>>();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const returnTo = Array.isArray(routeParams.returnTo)
    ? routeParams.returnTo[0]
    : routeParams.returnTo;

  const handleBack = () => {
    if (returnTo === '/booking/review') {
      const bookingParams = Object.fromEntries(
        Object.entries(routeParams)
          .filter(([key]) => key !== 'returnTo')
          .map(([key, value]) => [
            key,
            Array.isArray(value) ? value[0] : value ?? '',
          ]),
      );

      router.replace({
        pathname: '/booking/review',
        params: bookingParams,
      } as never);
      return;
    }

    router.back();
  };

  const handleSubmit = useCallback(async (values: PatientFormValues) => {
    if (saving) return;

    setSaving(true);
    setError(null);

    try {
      await patientService.create(toPayload(values));

      const returnTo = Array.isArray(routeParams.returnTo)
        ? routeParams.returnTo[0]
        : routeParams.returnTo;

      if (returnTo === '/booking/review') {
        const bookingParams = Object.fromEntries(
          Object.entries(routeParams)
            .filter(([key]) => key !== 'returnTo')
            .map(([key, value]) => [
              key,
              Array.isArray(value) ? value[0] : value ?? '',
            ]),
        );

        router.replace({
          pathname: '/booking/review',
          params: bookingParams,
        } as never);
      } else {
        router.replace('/profiles/patient' as never);
      }
    } catch (err: any) {
      const data = err?.response?.data;
      const validationErrors = data?.errors
        ? Object.values(data.errors).flat().join('\n')
        : null;

      setError(
        validationErrors ||
          data?.message ||
          'Unable to create your patient profile. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  }, [router, routeParams, saving]);

  return (
    <ScrollView
      style={styles.profileScroll}
      contentContainerStyle={styles.profileFormScrollContent}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets
    >
      <ScreenHeader
        title="Create Patient Profile"
        subtitle={returnTo === '/booking/review' ? 'Complete your patient details to continue with your appointment.' : 'Add your personal details and profile photo.'}
        showBack
        onBack={handleBack}
      />

      {error ? (
        <AppText variant="error" style={styles.profileFormError}>
          {error}
        </AppText>
      ) : null}

      <PatientForm
        onChange={() => undefined}
        onSubmit={handleSubmit}
        saving={saving}
      />
    </ScrollView>
  );
}
