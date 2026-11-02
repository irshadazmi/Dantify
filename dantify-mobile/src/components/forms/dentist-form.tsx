
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
import { AppInput } from '@/components/ui/app-input';
import { AppText } from '@/components/ui/app-text';
import { useStyles } from '@/styles/styles';
import { useAppColors } from '@/hooks/use-app-colors';

/* ======================================================
   TYPES
====================================================== */

const GENDERS = ['Male', 'Female', 'Other'] as const;

export type DentistFormValues = {
  name: string;
  gender: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  phone: string;
  email: string;
  specialization: string;
};

type DentistSpecificField =
  | 'name'
  | 'gender'
  | 'phone'
  | 'email'
  | 'specialization';

type Props = {
  user_id?: number;
  onChange: (values: DentistFormValues) => void;
  onSubmit: (
    values: DentistFormValues,
  ) => void | Promise<void>;
  initialValues?: Partial<DentistFormValues>;
  saving?: boolean;
};

/* ======================================================
   VALIDATION
====================================================== */

const DentistSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Dentist name is required')
    .max(150, 'Name cannot exceed 150 characters'),

  gender: z
    .string()
    .refine(
      (value) =>
        value === '' ||
        GENDERS.includes(value as (typeof GENDERS)[number]),
      'Select a valid gender',
    ),

  // Shared address fields: keep these keys aligned with
  // DentistFormValues and the AddressFields component.
  address: z
    .string()
    .trim()
    .max(255, 'Address cannot exceed 255 characters'),

  city: z
    .string()
    .trim()
    .max(100, 'City cannot exceed 100 characters'),

  state: z
    .string()
    .trim()
    .max(100, 'State cannot exceed 100 characters'),

  country: z
    .string()
    .trim()
    .max(100, 'Country cannot exceed 100 characters'),

  postal_code: z
    .string()
    .trim()
    .max(20, 'Postal code cannot exceed 20 characters'),

  phone: z
    .string()
    .trim()
    .refine(
      (value) =>
        value === '' || /^\+?[0-9\s()-]{7,20}$/.test(value),
      'Enter a valid phone number',
    ),

  email: z
    .string()
    .trim()
    .refine(
      (value) =>
        value === '' ||
        z.string().email().safeParse(value).success,
      'Enter a valid email address',
    )
    .max(254, 'Email address is too long'),

  specialization: z
    .string()
    .trim()
    .max(150, 'Specialization cannot exceed 150 characters'),
});

/* ======================================================
   DEFAULT VALUES
====================================================== */

function createDefaultValues(
  values?: Partial<DentistFormValues>,
): DentistFormValues {
  return {
    name: values?.name ?? '',
    gender: values?.gender ?? '',
    address: values?.address ?? '',
    city: values?.city ?? '',
    state: values?.state ?? '',
    country: values?.country ?? '',
    postal_code: values?.postal_code ?? '',
    phone: values?.phone ?? '',
    email: values?.email ?? '',
    specialization: values?.specialization ?? '',
  };
}

/* ======================================================
   COMPONENT
====================================================== */

export default function DentistForm({
  user_id,
  onChange,
  onSubmit,
  initialValues,
  saving = false,
}: Props) {
  const styles = useStyles();
  const COLORS = useAppColors();

  const isEditMode = user_id !== undefined;

  const defaults = React.useMemo(
    () => createDefaultValues(initialValues),
    [
      initialValues?.name,
      initialValues?.gender,
      initialValues?.address,
      initialValues?.city,
      initialValues?.state,
      initialValues?.country,
      initialValues?.postal_code,
      initialValues?.phone,
      initialValues?.email,
      initialValues?.specialization,
    ],
  );

  const {
    control,
    reset,
    setValue,
    trigger,
    handleSubmit,
    formState: { errors },
  } = useForm<DentistFormValues>({
    resolver: zodResolver(DentistSchema),
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
    field: DentistSpecificField,
    value: string,
  ) => {
    setValue(field, value, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const renderField = (
    field: Exclude<DentistSpecificField, 'gender'>,
    label: string,
    placeholder: string,
    options?: {
      keyboardType?: 'default' | 'email-address' | 'phone-pad';
      autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    },
  ) => (
    <View key={field} style={{ marginBottom: 8 }}>
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
              editable={!saving}
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

      {errors[field]?.message ? (
        <AppText
          variant="error"
          style={{ marginTop: 2, marginBottom: 4 }}
        >
          {errors[field]?.message}
        </AppText>
      ) : null}
    </View>
  );

  return (
    <View>
      {renderField('name', 'Full Name', 'Enter full name')}

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

      {errors.gender?.message ? (
        <AppText
          variant="error"
          style={{ marginBottom: 8 }}
        >
          {errors.gender.message}
        </AppText>
      ) : null}

      {renderField(
        'specialization',
        'Specialization',
        'e.g. Orthodontics, General Dentistry',
      )}

      <AddressFields<DentistFormValues>
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
        },
      )}

      {renderField(
        'email',
        'Email',
        'dentist@example.com',
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
                'The dentist profile could not be saved. Please try again.',
              );
            }
          })();
        }}
        disabled={saving}
        accessibilityRole="button"
        accessibilityState={{ disabled: saving, busy: saving }}
        style={[
          styles.button,
          {
            marginTop: 16,
            marginBottom: 24,
            opacity: saving ? 0.6 : 1,
          },
        ]}
      >
        <AppText style={styles.buttonText}>
          {saving
            ? 'Saving...'
            : isEditMode
              ? 'Update Dentist Profile'
              : 'Save Dentist Profile'}
        </AppText>
      </Pressable>
    </View>
  );
}
