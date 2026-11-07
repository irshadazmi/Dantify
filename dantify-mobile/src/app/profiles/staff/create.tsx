
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

import StaffForm, { type StaffFormValues } from '@/components/forms/staff-form';
import staffService from '@/services/staff-service';
import clinicService from '@/services/clinic-service';
import type { StaffCreatePayload } from '@/types/staff';

import { AppText } from '@/components/ui/app-text';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useStyles } from '@/styles/styles';

function toPayload(
  values: StaffFormValues,
  clinicId: number,
): StaffCreatePayload {
  return {
    clinic_id: clinicId,
    name: values.name.trim(),
    job_title: values.job_title.trim(),
    gender: values.gender.trim() || null,
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

export default function CreateStaffProfile() {
  const styles = useStyles();
  const router = useRouter();

  const [clinicId, setClinicId] = useState<number | null>(null);
  const [clinicLoading, setClinicLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Retrieve the clinic associated with the authenticated administrator.
  useEffect(() => {
    let mounted = true;

    const loadClinic = async () => {
      try {
        setClinicLoading(true);
        setError(null);

        const response = await clinicService.getMyProfile();
        const rawClinicId = response.data?.id;
        const id = Number(rawClinicId);

        if (
          rawClinicId === null ||
          rawClinicId === undefined ||
          String(rawClinicId).trim() === '' ||
          !Number.isSafeInteger(id) ||
          id <= 0
        ) {
          throw new Error('No valid clinic profile was found.');
        }

        if (mounted) {
          setClinicId(id);
        }
      } catch (err: any) {
        if (mounted) {
          setError(
            err?.response?.data?.message ||
            err?.message ||
            'Unable to retrieve your clinic profile.',
          );
        }
      } finally {
        if (mounted) {
          setClinicLoading(false);
        }
      }
    };

    loadClinic();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = useCallback(async (values: StaffFormValues) => {
    if (saving || clinicId === null) return;

    setSaving(true);
    setError(null);

    try {
      await staffService.create(toPayload(values, clinicId));

      router.replace('/profiles/staff' as never);
    } catch (err: any) {
      const data = err?.response?.data;

      const validationErrors = data?.errors
        ? Object.values(data.errors).flat().join('\n')
        : null;

      setError(
        validationErrors ||
        data?.message ||
        'Unable to create the staff profile. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  }, [clinicId, router, saving]);

  return (
    <ScrollView
      style={styles.profileScroll}
      contentContainerStyle={styles.profileFormScrollContent}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets
    >
      <ScreenHeader
        title="Create Staff Profile"
        subtitle="Add your professional details and profile photo."
        showBack
        onBack={() => router.back()}
      />

      {error ? (
        <AppText variant="error" style={styles.profileFormError}>
          {error}
        </AppText>
      ) : null}

      {clinicLoading ? (
        <ActivityIndicator style={{ marginTop: 24 }} />
      ) : clinicId === null ? (
        <AppText variant="error" style={styles.profileFormError}>
          A valid clinic profile is required before creating staff.
        </AppText>
      ) : (
        <StaffForm
          onChange={() => undefined}
          onSubmit={handleSubmit}
          saving={saving}
        />
      )}
    </ScrollView>
  );
}
