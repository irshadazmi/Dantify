import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import PatientForm, {
  type PatientFormValues,
} from '@/components/forms/patient-form';
import { patientService } from '@/services/patient-service';
import type {
  Patient,
  PatientCreateRequest,
  PatientUpdateRequest,
} from '@/types/patient';
import { AppText } from '@/components/ui/app-text';
import { useAppColors } from '@/hooks/use-app-colors';
import { useStyles } from '@/styles/styles';

function toFormValues(
  patient: Patient,
): Partial<PatientFormValues> {
  return {
    name: patient.name ?? '',
    gender:
      patient.gender === 'Female' || patient.gender === 'Other'
        ? patient.gender
        : 'Male',
    dob: patient.dob?.slice(0, 10) ?? '',
    address: patient.address ?? '',
    city: patient.city ?? '',
    state: patient.state ?? '',
    country: patient.country ?? '',
    postal_code: patient.postal_code ?? '',
    phone: patient.phone ?? '',
    email: patient.email ?? '',
  };
}

function toPayload(
  values: PatientFormValues,
): PatientCreateRequest {
  return {
    name: values.name.trim(),
    gender: values.gender,
    dob: values.dob,
    address: values.address.trim(),
    city: values.city.trim(),
    state: values.state.trim(),
    country: values.country.trim(),
    postal_code: values.postal_code.trim(),
    phone: values.phone.trim() || null,
    email: values.email.trim().toLowerCase() || null,
  };
}

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  const responseError = error as {
    response?: {
      data?: {
        message?: string;
        errors?: Record<string, string[]>;
      };
    };
  };

  const data = responseError?.response?.data;

  if (data?.errors) {
    const messages = Object.values(data.errors).flat();
    if (messages.length > 0) {
      return messages.join('\n');
    }
  }

  return data?.message ?? fallback;
}

export default function CreatePatientProfile() {
  const styles = useStyles();
  const COLORS = useAppColors();
  const router = useRouter();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formValues, setFormValues] =
    useState<Partial<PatientFormValues>>({});

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        setLoading(true);
        setError(null);

        const result = await patientService.getMyProfile();

        if (cancelled) return;

        setPatient(result);
        setFormValues(result ? toFormValues(result) : {});
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            getErrorMessage(
              err,
              'Unable to load your patient profile. Please try again.',
            ),
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleFormChange = useCallback(
    (values: PatientFormValues) => {
      setFormValues(values);
    },
    [],
  );

  const handleSubmit = useCallback(
    async (values: PatientFormValues) => {
      if (saving) return;

      setSaving(true);
      setError(null);

      try {
        const payload = toPayload(values);

        const savedPatient = patient
          ? await patientService.update(
            patient.id,
            payload satisfies PatientUpdateRequest,
          )
          : await patientService.create(payload);

        setPatient(savedPatient);
        setFormValues(toFormValues(savedPatient));

        router.replace('/dashboard' as never);
      } catch (err: unknown) {
        setError(
          getErrorMessage(
            err,
            'Unable to save your patient profile. Please try again.',
          ),
        );
      } finally {
        setSaving(false);
      }
    },
    [patient, router, saving],
  );

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: COLORS.background,
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />
        <AppText style={{ marginTop: 12 }}>
          Loading patient profile...
        </AppText>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      contentContainerStyle={[
        styles.container,
        {
          paddingBottom: 48,
          flexGrow: 1,
        },
      ]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator
    >
      <AppText style={styles.title}>
        {patient ? 'Update Patient Profile' : 'Create Patient Profile'}
      </AppText>

      <AppText
        style={[
          styles.subtitle,
          { color: COLORS.textMuted, marginBottom: 20 },
        ]}
      >
        Enter your personal and contact details to complete your
        patient registration.
      </AppText>

      {error ? (
        <AppText variant="error" style={{ marginBottom: 12 }}>
          {error}
        </AppText>
      ) : null}

      <PatientForm
        user_id={patient?.user_id}
        initialValues={formValues}
        onChange={handleFormChange}
        onSubmit={handleSubmit}
        saving={saving}
      />
    </ScrollView>
  );
}