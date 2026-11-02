
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

export type LaboratoryFormValues = {
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  registration_number: string;
  notes: string;
};

type LaboratorySpecificField =
  | 'name'
  | 'contact_person'
  | 'email'
  | 'phone'
  | 'registration_number'
  | 'notes';

type Props = {
  user_id?: number;
  onChange: (values: LaboratoryFormValues) => void;
  onSubmit: (values: LaboratoryFormValues) => void | Promise<void>;
  initialValues?: Partial<LaboratoryFormValues>;
  saving?: boolean;
};

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} cannot exceed ${max} characters`);

const LaboratorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Laboratory name is required')
    .max(150, 'Laboratory name cannot exceed 150 characters'),

  contact_person: optionalText(150, 'Contact person'),

  email: z
    .string()
    .trim()
    .refine(
      (value) => !value || z.string().email().safeParse(value).success,
      'Enter a valid email address',
    )
    .max(254, 'Email address is too long'),

  phone: z
    .string()
    .trim()
    .refine(
      (value) => !value || /^\+?[0-9\s()-]{7,20}$/.test(value),
      'Enter a valid phone number',
    ),

  address: optionalText(255, 'Address'),
  city: optionalText(100, 'City'),
  state: optionalText(100, 'State'),
  country: optionalText(100, 'Country'),
  postal_code: optionalText(20, 'Postal code'),

  registration_number: optionalText(100, 'Registration number'),
  notes: optionalText(2000, 'Notes'),
});

function createDefaultValues(
  values?: Partial<LaboratoryFormValues>,
): LaboratoryFormValues {
  return {
    name: values?.name ?? '',
    contact_person: values?.contact_person ?? '',
    email: values?.email ?? '',
    phone: values?.phone ?? '',
    address: values?.address ?? '',
    city: values?.city ?? '',
    state: values?.state ?? '',
    country: values?.country ?? '',
    postal_code: values?.postal_code ?? '',
    registration_number: values?.registration_number ?? '',
    notes: values?.notes ?? '',
  };
}

export default function LaboratoryForm({
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
      initialValues?.contact_person,
      initialValues?.email,
      initialValues?.phone,
      initialValues?.address,
      initialValues?.city,
      initialValues?.state,
      initialValues?.country,
      initialValues?.postal_code,
      initialValues?.registration_number,
      initialValues?.notes,
    ],
  );

  const {
    control,
    reset,
    trigger,
    handleSubmit,
    formState: { errors },
  } = useForm<LaboratoryFormValues>({
    resolver: zodResolver(LaboratorySchema),
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
    field: LaboratorySpecificField,
    label: string,
    placeholder: string,
    options?: {
      keyboardType?: 'default' | 'email-address' | 'phone-pad';
      autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
      multiline?: boolean;
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
              multiline={options?.multiline}
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
      {renderField('name', 'Name', 'Enter laboratory name')}

      {renderField(
        'contact_person',
        'Contact Person',
        'Enter contact person',
      )}

      <AddressFields<LaboratoryFormValues>
        control={control}
        errors={errors}
        trigger={trigger}
        saving={saving}
      />

      {renderField(
        'registration_number',
        'Registration Number',
        'Enter registration number',
        { autoCapitalize: 'characters' },
      )}

      {renderField(
        'notes',
        'Notes',
        'Additional information',
        { autoCapitalize: 'sentences', multiline: true },
      )}

      {renderField('email', 'Email', 'lab@example.com', {
        keyboardType: 'email-address',
        autoCapitalize: 'none',
      })}

      {renderField('phone', 'Phone', 'Enter phone number', {
        keyboardType: 'phone-pad',
        autoCapitalize: 'none',
      })}

      <Pressable
        onPress={() => {
          void handleSubmit(async (values) => {
            try {
              await onSubmit(createDefaultValues(values));
            } catch {
              Alert.alert(
                'Unable to save',
                'The laboratory profile could not be saved. Please try again.',
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
              ? 'Update Laboratory Profile'
              : 'Save Laboratory Profile'}
        </AppText>
      </Pressable>
    </View>
  );
}
