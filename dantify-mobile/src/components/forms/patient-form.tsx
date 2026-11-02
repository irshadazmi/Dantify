import React from 'react';
import { Alert, Pressable, View } from 'react-native';
import {
  Controller,
  useForm,
  useWatch,
} from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import AddressFields from '@/components/forms/address-fields';
import { InlineField } from '@/components/ui/inline-field';
import { InlineDateSpinner } from '@/components/ui/inline-date-spinner';
import { AppInput } from '@/components/ui/app-input';
import { AppText } from '@/components/ui/app-text';
import { useStyles } from '@/styles/styles';
import { useAppColors } from '@/hooks/use-app-colors';
import { GenderType } from '@/constants/CONSTANTS';
import type { AddressFormValues } from '@/types/address';

export type PatientFormValues = AddressFormValues & {
  name: string;
  gender: GenderType;
  dob: string;
  phone: string;
  email: string;
};

type Props = {
  user_id?: number;
  onChange: (values: PatientFormValues) => void;
  onSubmit: (values: PatientFormValues) => void | Promise<void>;
  initialValues?: Partial<PatientFormValues>;
  saving?: boolean;
};

const GENDERS = ['Male', 'Female', 'Other'] as const;

function isValidDateString(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

const PatientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Patient name is required')
    .max(150, 'Name cannot exceed 150 characters'),

  gender: z.enum(GENDERS, {
    error: 'Please select a gender',
  }),

  dob: z
    .string()
    .min(1, 'Date of birth is required')
    .refine(
      isValidDateString,
      'Enter a valid date of birth',
    )
    .refine((value) => {
      if (!isValidDateString(value)) return true;
      return value <= new Date().toISOString().slice(0, 10);
    }, 'Date of birth cannot be in the future'),

  address: z
    .string()
    .trim()
    .min(1, 'Address is required')
    .max(255, 'Address cannot exceed 255 characters'),

  city: z
    .string()
    .trim()
    .min(1, 'City is required')
    .max(100, 'City cannot exceed 100 characters'),

  state: z
    .string()
    .trim()
    .max(100, 'State cannot exceed 100 characters'),

  country: z
    .string()
    .trim()
    .min(1, 'Country is required')
    .max(100, 'Country cannot exceed 100 characters'),

  postal_code: z
    .string()
    .trim()
    .max(20, 'Postal code cannot exceed 20 characters'),

  phone: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || /^\+?[0-9\s()-]{7,20}$/.test(value),
      'Enter a valid phone number',
    ),

  email: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || z.string().email().safeParse(value).success,
      'Enter a valid email address',
    )
    .max(254, 'Email address is too long'),
});

function createDefaultValues(
  values?: Partial<PatientFormValues>,
): PatientFormValues {
  return {
    name: values?.name ?? '',
    gender: GENDERS.includes(
      values?.gender as (typeof GENDERS)[number],
    )
      ? values!.gender!
      : 'Male',
    // Do not invent a date of birth for a new patient.
    dob: values?.dob ?? '',
    address: values?.address ?? '',
    city: values?.city ?? '',
    state: values?.state ?? '',
    country: values?.country ?? '',
    postal_code: values?.postal_code ?? '',
    phone: values?.phone ?? '',
    email: values?.email ?? '',
  };
}

export default function PatientForm({
  user_id,
  onChange,
  onSubmit,
  initialValues,
  saving = false,
}: Props) {
  const styles = useStyles();
  const COLORS = useAppColors();
  const isEditMode = Boolean(user_id);

  const defaults = React.useMemo(
    () => createDefaultValues(initialValues),
    [
      initialValues?.name,
      initialValues?.gender,
      initialValues?.dob,
      initialValues?.address,
      initialValues?.city,
      initialValues?.state,
      initialValues?.country,
      initialValues?.postal_code,
      initialValues?.phone,
      initialValues?.email,
    ],
  );

  const {
    control,
    reset,
    setValue,
    trigger,
    handleSubmit,
    formState: { errors },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(PatientSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: defaults,
  });

  const watchedValues = useWatch({ control });

  React.useEffect(() => {
    reset(defaults);
  }, [defaults, reset]);

  React.useEffect(() => {
    onChange(createDefaultValues(watchedValues));
  }, [watchedValues, onChange]);

  const updateField = (
    field: 'gender',
    value: GenderType,
  ) => {
    setValue(field, value, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const renderField = (
    field: 'name' | 'phone' | 'email',
    label: string,
    placeholder: string,
    options?: {
      keyboardType?: 'default' | 'email-address' | 'phone-pad';
      autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
      editable?: boolean;
    },
  ) => (
    <View style={{ marginBottom: 8 }}>
      <InlineField label={label}>
        <Controller
          control={control}
          name={field}
          render={({ field: formField }) => (
            <AppInput
              value={formField.value}
              onChangeText={formField.onChange}
              onBlur={() => {
                formField.onBlur();
                void trigger(field);
              }}
              placeholder={placeholder}
              keyboardType={options?.keyboardType ?? 'default'}
              autoCapitalize={options?.autoCapitalize ?? 'words'}
              autoCorrect={false}
              editable={!saving && (options?.editable ?? true)}
              style={
                errors[field]
                  ? { borderColor: COLORS.danger }
                  : undefined
              }
              accessibilityLabel={label}
            />
          )}
        />
      </InlineField>

      {errors[field]?.message && (
        <AppText
          variant="error"
          style={{ marginTop: 2, marginBottom: 4 }}
        >
          {errors[field]?.message}
        </AppText>
      )}
    </View>
  );

  return (
    <View>
      {renderField('name', 'Patient Name', 'Enter full name')}

      <InlineField label="Gender">
        <View style={styles.chipsContainer}>
          {GENDERS.map((gender) => {
            const selected = watchedValues.gender === gender;

            return (
              <Pressable
                key={gender}
                onPress={() => updateField('gender', gender)}
                disabled={saving}
                style={[
                  styles.chip,
                  selected && styles.chipSelected,
                  errors.gender
                    ? { borderColor: COLORS.danger }
                    : {},
                  saving ? { opacity: 0.6 } : {},
                ]}
                accessibilityRole="radio"
                accessibilityState={{
                  selected,
                  disabled: saving,
                }}
              >
                <AppText
                  style={[
                    styles.chipText,
                    selected && styles.chipTextSelected,
                  ]}
                >
                  {gender}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </InlineField>

      {errors.gender?.message && (
        <AppText
          variant="error"
          style={{ marginBottom: 8 }}
        >
          {errors.gender.message}
        </AppText>
      )}

      <Controller
        control={control}
        name="dob"
        render={({ field: formField }) => (
          <View>
            <InlineDateSpinner
              label="Date of Birth"
              value={formField.value}
              onChange={(value) => {
                formField.onChange(value);
                void trigger('dob');
              }}
            />
          </View>
        )}
      />

      {errors.dob?.message && (
        <AppText
          variant="error"
          style={{ marginTop: 2, marginBottom: 8 }}
        >
          {errors.dob.message}
        </AppText>
      )}

      <AddressFields<PatientFormValues>
        control={control}
        errors={errors}
        trigger={trigger}
        saving={saving}
      />

      {renderField(
        'phone',
        'Phone',
        'Enter phone number',
        {
          keyboardType: 'phone-pad',
          autoCapitalize: 'none',
          editable: !isEditMode,
        },
      )}

      {renderField(
        'email',
        'Email',
        'patient@example.com',
        {
          keyboardType: 'email-address',
          autoCapitalize: 'none',
        },
      )}

      <Pressable
        onPress={() => {
          void handleSubmit(async (values) => {
            try {
              await onSubmit(createDefaultValues(values));
            } catch {
              Alert.alert(
                'Unable to save',
                'The patient profile could not be saved. Please try again.',
              );
            }
          })();
        }}
      >
        <AppText style={styles.buttonText}>
          {saving
            ? 'Saving...'
            : isEditMode
              ? 'Update Patient Profile'
              : 'Save Patient Profile'}
        </AppText>
      </Pressable>
    </View>
  );
}