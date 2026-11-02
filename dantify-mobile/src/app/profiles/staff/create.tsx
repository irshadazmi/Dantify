
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import StaffForm, {
  type StaffFormValues,
} from '@/components/forms/staff-form';

import staffService from '@/services/staff-service';

import type {
  Staff,
  StaffCreatePayload,
  StaffUpdatePayload,
} from '@/types/staff';

import { AppText } from '@/components/ui/app-text';
import { useAppColors } from '@/hooks/use-app-colors';
import { useStyles } from '@/styles/styles';

interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
  next_step?: string;
}

function toFormValues(staff?: Staff | null): StaffFormValues {
  return {
    name: staff?.name ?? '',
    job_title: staff?.job_title ?? '',
    gender: staff?.gender ?? '',
    address: staff?.address ?? '',
    city: staff?.city ?? '',
    country: staff?.country ?? '',
    phone: staff?.phone ?? '',
    email: staff?.email ?? '',
  };
}

function toPayload(
  values: StaffFormValues,
  clinicId: number
): StaffCreatePayload {
  return {
    clinic_id: clinicId,
    name: values.name.trim(),
    job_title: values.job_title.trim() || null,
    gender: values.gender || null,
    address: values.address.trim() || null,
    city: values.city.trim() || null,
    country: values.country.trim() || null,
    phone: values.phone.trim() || null,
    email: values.email.trim() || null,
  };
}

function getErrorMessage(error: unknown): string {
  const responseData = (
    error as {
      response?: { data?: ApiErrorResponse };
    }
  )?.response?.data;

  if (responseData?.errors) {
    return Object.values(responseData.errors)
      .flat()
      .join('\n');
  }

  return (
    responseData?.message ??
    'Unable to save the staff profile. Please try again.'
  );
}

interface StaffProfileScreenProps {
  /**
   * Supply the clinic ID from trusted application context.
   * For a staff user's own profile, the backend should determine
   * clinic association from the authenticated account.
   */
  clinicId?: number;
}

export default function CreateStaffProfileScreen({
  clinicId,
}: StaffProfileScreenProps) {
  const router = useRouter();
  const colors = useAppColors();
  const styles = useStyles();

  const [staff, setStaff] = useState<Staff | null>(null);
  const [formValues, setFormValues] = useState<StaffFormValues>(
    toFormValues()
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await staffService.getMyProfile();

      const profile = response.data ?? null;

      setStaff(profile);
      setFormValues(toFormValues(profile));
    } catch (err) {
      const responseData = (
        err as {
          response?: { status?: number; data?: ApiErrorResponse };
        }
      )?.response;

      // The backend uses 404 to indicate that the profile
      // does not exist yet.
      if (
        responseData?.status === 404 &&
        responseData.data?.next_step === 'create_profile'
      ) {
        setStaff(null);
        setFormValues(toFormValues());
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleFormChange = useCallback(
    (values: StaffFormValues) => {
      setFormValues(values);
    },
    []
  );

  const handleSubmit = useCallback(
    async (values: StaffFormValues) => {
      setSaving(true);
      setError('');

      try {
        let savedStaff: Staff;

        if (staff) {
          const payload: StaffUpdatePayload = {
            name: values.name.trim(),
            job_title: values.job_title.trim() || null,
            gender: values.gender || null,
            address: values.address.trim() || null,
            city: values.city.trim() || null,
            country: values.country.trim() || null,
            phone: values.phone.trim() || null,
            email: values.email.trim() || null,
          };

          savedStaff = await staffService.update(staff.id, payload);
        } else {
          if (!clinicId) {
            setError(
              'A clinic association is required to create a staff profile. ' +
                'Please open this form through the appropriate clinic workflow.'
            );
            return;
          }

          savedStaff = await staffService.create(
            toPayload(values, clinicId)
          );
        }

        setStaff(savedStaff);
        router.replace('/dashboard' as never);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setSaving(false);
      }
    },
    [clinicId, router, staff]
  );

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <AppText>Loading staff profile...</AppText>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 32 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ padding: 16, gap: 16 }}>
        <AppText>
          {staff ? 'Update Staff Profile' : 'Create Staff Profile'}
        </AppText>

        {error ? (
          <AppText>{error}</AppText>
        ) : null}

        <StaffForm
          initialValues={formValues}
          user_id={staff?.user_id}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
          saving={saving}
        />
      </View>
    </ScrollView>
  );
}
