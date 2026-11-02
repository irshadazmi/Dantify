
import React from 'react';
import { Alert, View, Pressable } from 'react-native';
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
import type { AddressFormValues } from '@/types/address';

export type ClinicFormValues = AddressFormValues & {
  name: string;
  phone: string;
  email: string;
};

type Props = {
  user_id?: number;
  onChange: (values: ClinicFormValues) => void;
  onSubmit: (values: ClinicFormValues) => void | Promise<void>;
  initialValues?: Partial<ClinicFormValues>;
  saving?: boolean;
};

const ClinicSchema = z.object({
  name: z.string().trim()
    .min(1, 'Clinic name is required')
    .max(150, 'Clinic name cannot exceed 150 characters'),

  address: z.string().trim()
    .min(1, 'Address is required')
    .max(255, 'Address cannot exceed 255 characters'),

  city: z.string().trim()
    .min(1, 'City is required')
    .max(100, 'City cannot exceed 100 characters'),

  state: z.string().trim()
    .max(100, 'State cannot exceed 100 characters'),

  country: z.string().trim()
    .min(1, 'Country is required')
    .max(100, 'Country cannot exceed 100 characters'),

  postal_code: z.string().trim()
    .max(20, 'Postal code cannot exceed 20 characters'),

  phone: z.string().trim().refine(
    (value) => value === '' || /^\+?[0-9\s()-]{7,20}$/.test(value),
    'Enter a valid phone number',
  ),

  email: z.string().trim()
    .refine(
      (value) => value === '' || z.string().email().safeParse(value).success,
      'Enter a valid email address',
    )
    .refine((value) => value.length <= 254, 'Email address is too long'),
});

function createDefaultValues(
  values?: Partial<ClinicFormValues>,
): ClinicFormValues {
  return {
    name: values?.name ?? '',
    address: values?.address ?? '',
    city: values?.city ?? '',
    state: values?.state ?? '',
    country: values?.country ?? '',
    postal_code: values?.postal_code ?? '',
    phone: values?.phone ?? '',
    email: values?.email ?? '',
  };
}

export default function ClinicForm({
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
    trigger,
    handleSubmit,
    formState: { errors },
  } = useForm<ClinicFormValues>({
    resolver: zodResolver(ClinicSchema),
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

  const renderField = (
    field: 'name' | 'phone' | 'email',
    label: string,
    placeholder: string,
    options?: {
      keyboardType?: 'default' | 'email-address' | 'phone-pad';
      autoCapitalize?: 'none' | 'sentences' | 'words';
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
      {renderField('name', 'Clinic Name', 'Enter clinic name')}

      <AddressFields<ClinicFormValues>
        control={control}
        errors={errors}
        trigger={trigger}
        saving={saving}
      />

      {renderField(
        'phone',
        'Clinic Phone',
        'Enter clinic phone number',
        {
          keyboardType: 'phone-pad',
          autoCapitalize: 'none',
        },
      )}

      {renderField(
        'email',
        'Clinic Email',
        'clinic@example.com',
        {
          keyboardType: 'email-address',
          autoCapitalize: 'none',
        },
      )}

      <Pressable
        onPress={() => {
          void handleSubmit(async (values) => {
            try {
              await onSubmit({
                ...values,
                name: values.name.trim(),
                address: values.address.trim(),
                city: values.city.trim(),
                state: values.state.trim(),
                country: values.country.trim(),
                postal_code: values.postal_code.trim(),
                phone: values.phone.trim(),
                email: values.email.trim(),
              });

              Alert.alert(
                'Success',
                isEditMode
                  ? 'Clinic profile updated successfully.'
                  : 'Clinic profile saved successfully.',
              );
            } catch {
              Alert.alert(
                'Unable to save',
                'The clinic profile could not be saved. Please try again.',
              );
            }
          })(); // Add () here to execute handleSubmit
        }}
        disabled={saving}
        accessibilityRole="button"
        accessibilityState={{ disabled: saving, busy: saving }}
        style={[
          styles.button,
          { marginTop: 16, opacity: saving ? 0.6 : 1 },
        ]}
      >
        <AppText style={styles.buttonText}>
          {saving
            ? 'Saving...'
            : isEditMode
              ? 'Update Clinic Profile'
              : 'Save Clinic Profile'}
        </AppText>
      </Pressable>
    </View>
  );
}
