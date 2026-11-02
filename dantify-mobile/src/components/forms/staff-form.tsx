
import React from 'react';
import { View, Pressable, Alert } from 'react-native';
import {
  Controller,
  useForm,
  useWatch,
} from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { InlineField } from '@/components/ui/inline-field';
import { AppInput } from '@/components/ui/app-input';
import { AppText } from '@/components/ui/app-text';
import { useStyles } from '@/styles/styles';
import { useAppColors } from '@/hooks/use-app-colors';

/* ======================================================
   TYPES
====================================================== */

const GENDERS = ['Male', 'Female', 'Other'] as const;

export type StaffFormValues = {
  name: string;
  job_title: string;
  gender: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
};

type Props = {
  user_id?: number;
  onChange: (values: StaffFormValues) => void;
  onSubmit: (values: StaffFormValues) => void | Promise<void>;
  initialValues?: Partial<StaffFormValues>;
  saving?: boolean;
};

/* ======================================================
   VALIDATION
====================================================== */

const StaffSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Staff name is required')
    .max(150, 'Name cannot exceed 150 characters'),

  job_title: z
    .string()
    .trim()
    .max(150, 'Job title cannot exceed 150 characters'),

  gender: z
    .string()
    .refine(
      (value) =>
        value === '' ||
        GENDERS.includes(value as (typeof GENDERS)[number]),
      'Select a valid gender',
    ),

  address: z
    .string()
    .trim()
    .max(500, 'Address cannot exceed 500 characters'),

  city: z
    .string()
    .trim()
    .max(100, 'City cannot exceed 100 characters'),

  country: z
    .string()
    .trim()
    .max(100, 'Country cannot exceed 100 characters'),

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
    .refine(
      (value) => value.length <= 254,
      'Email address is too long',
    ),
});

/* ======================================================
   DEFAULT VALUES
====================================================== */

function createDefaultValues(
  values?: Partial<StaffFormValues>,
): StaffFormValues {
  return {
    name: values?.name ?? '',
    job_title: values?.job_title ?? '',
    gender: values?.gender ?? '',
    address: values?.address ?? '',
    city: values?.city ?? '',
    country: values?.country ?? '',
    phone: values?.phone ?? '',
    email: values?.email ?? '',
  };
}

/* ======================================================
   COMPONENT
====================================================== */

export default function StaffForm({
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
      initialValues?.job_title,
      initialValues?.gender,
      initialValues?.address,
      initialValues?.city,
      initialValues?.country,
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
  } = useForm<StaffFormValues>({
    resolver: zodResolver(StaffSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: defaults,
  });

  const watchedValues = useWatch({ control });

  React.useEffect(() => {
    reset(defaults);
  }, [defaults, reset]);

  React.useEffect(() => {
    onChange({
      name: watchedValues.name ?? '',
      job_title: watchedValues.job_title ?? '',
      gender: watchedValues.gender ?? '',
      address: watchedValues.address ?? '',
      city: watchedValues.city ?? '',
      country: watchedValues.country ?? '',
      phone: watchedValues.phone ?? '',
      email: watchedValues.email ?? '',
    });
  }, [watchedValues, onChange]);

  const updateField = (
    field: keyof StaffFormValues,
    value: string,
  ) => {
    setValue(field, value, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const renderField = (
    field: keyof StaffFormValues,
    label: string,
    placeholder: string,
    options?: {
      keyboardType?: 'default' | 'email-address' | 'phone-pad';
      autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
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

      {renderField(
        'job_title',
        'Job Title',
        'e.g. Receptionist, Dental Assistant',
      )}

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
        <AppText variant="error" style={{ marginBottom: 8 }}>
          {errors.gender.message}
        </AppText>
      ) : null}

      {renderField('address', 'Address', 'Street / Area')}

      {renderField('city', 'City', 'Enter city')}

      {renderField('country', 'Country', 'Enter country')}

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
        'staff@example.com',
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
                'The staff profile could not be saved. Please try again.',
              );
            }
          })();
        }}
      >
        <AppText style={styles.buttonText}>
          {saving
            ? 'Saving...'
            : isEditMode
              ? 'Update Staff Profile'
              : 'Save Staff Profile'}
        </AppText>
      </Pressable>
    </View>
  );
}
