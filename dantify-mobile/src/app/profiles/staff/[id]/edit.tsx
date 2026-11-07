import React from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import StaffForm, { type StaffFormValues } from '@/components/forms/staff-form';
import staffService from '@/services/staff-service';
import type { Staff, StaffUpdatePayload } from '@/types/staff';
import { AppText } from '@/components/ui/app-text';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useAppColors } from '@/hooks/use-app-colors';
import { useStyles } from '@/styles/styles';

function toInitialValues(staff: Staff): Partial<StaffFormValues> {
  return {
    name: staff.name ?? '',
    job_title: staff.job_title ?? '',
    gender: staff.gender ?? '',
    dob: staff.dob?.slice(0, 10) ?? '',
    address: staff.address ?? '',
    city: staff.city ?? '',
    state: staff.state ?? '',
    country: staff.country ?? '',
    postal_code: staff.postal_code ?? '',
    phone: staff.phone ?? '',
    email: staff.email ?? '',
    profilePhoto: null,
    removeProfilePhoto: false,
  };
}

function toPayload(values: StaffFormValues): StaffUpdatePayload {
  return {
    name: values.name.trim(),
    job_title: values.job_title.trim(),
    gender: values.gender.trim(),
    dob: values.dob.trim() || null,
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

export default function EditStaffProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const staffId = Number(id);

  const styles = useStyles();
  const colors = useAppColors();
  const router = useRouter();

  const [staff, setStaff] = React.useState<Staff | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!Number.isSafeInteger(staffId) || staffId <= 0) {
        setError('Invalid staff profile.');
        setLoading(false);
        return;
      }

      try {
        setError(null);

        const result = await staffService.getById(staffId);

        if (!cancelled) {
          setStaff(result);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              'Unable to load staff profile.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [staffId]);

  const handleSubmit = async (values: StaffFormValues) => {
    if (!staff || saving) return;

    setSaving(true);
    setError(null);

    try {
      await staffService.update(staff.id, toPayload(values));
      router.replace('/profiles/staff' as never);
    } catch (err: any) {
      const data = err?.response?.data;

      const validationErrors = data?.errors
        ? Object.values(data.errors).flat().join('\n')
        : null;

      setError(
        validationErrors ||
          data?.message ||
          'Unable to update staff profile.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.profileLoading}>
        <ActivityIndicator size="large" color={colors.primary} />
        <AppText>Loading staff profile...</AppText>
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
        title="Edit Staff Profile"
        subtitle="Update your professional details and profile photo."
        showBack
        onBack={() => router.back()}
      />

      {error ? (
        <AppText variant="error" style={styles.profileFormError}>
          {error}
        </AppText>
      ) : null}

      {staff ? (
        <StaffForm
          key={staff.id}
          user_id={staff.user_id}
          initialValues={toInitialValues(staff)}
          initialPhotoUrl={staff.profile_photo_url}
          onChange={() => undefined}
          onSubmit={handleSubmit}
          saving={saving}
        />
      ) : (
        <View style={styles.emptyState}>
          <AppText variant="error">
            {error || 'Staff profile could not be loaded.'}
          </AppText>
        </View>
      )}
    </ScrollView>
  );
}