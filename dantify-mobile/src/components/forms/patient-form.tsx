import React from 'react';
import { Image, Pressable, View, Platform } from 'react-native';

import { showAppDialog } from "@/components/ui/app-dialog";
import * as ImagePicker from 'expo-image-picker';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import AddressFields from '@/components/forms/address-fields';
import { InlineField } from '@/components/ui/inline-field';
import { AppInput } from '@/components/ui/app-input';
import { AppText } from '@/components/ui/app-text';
import { useStyles } from '@/styles/styles';
import { useAppColors } from '@/hooks/use-app-colors';
import DateField from './date-field';

const GENDERS = ['Male', 'Female', 'Other'] as const;
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

export type PatientPhotoSelection = {
  uri: string;
  name: string;
  type: (typeof ALLOWED_PHOTO_TYPES)[number];
};

export type PatientFormValues = {
  name: string;
  gender: string;
  dob: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  phone: string;
  email: string;
  profilePhoto: PatientPhotoSelection | null;
  removeProfilePhoto: boolean;
};

type PatientSpecificField = 'name' | 'dob' | 'phone' | 'email';

type Props = {
  user_id?: number;
  initialPhotoUrl?: string | null;
  onChange: (values: PatientFormValues) => void;
  onSubmit: (values: PatientFormValues) => void | Promise<void>;
  initialValues?: Partial<PatientFormValues>;
  saving?: boolean;
};

const PatientSchema = z.object({
  name: z.string().trim()
    .min(1, 'Patient name is required')
    .max(100, 'Name cannot exceed 100 characters'),
  gender: z.string().refine(
    (value) => value === '' || GENDERS.includes(value as (typeof GENDERS)[number]),
    'Select a valid gender',
  ),
  dob: z.string()
    .min(1, 'Date of birth is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Select a valid date of birth')
    .refine((value) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

      const [year, month, day] = value.split('-').map(Number);
      const date = new Date(Date.UTC(year, month - 1, day));

      return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
      );
    }, 'Enter a valid date of birth')
    .refine((value) => {
      const [year, month, day] = value.split('-').map(Number);
      const today = new Date();
      const todayString = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0'),
      ].join('-');

      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` <= todayString;
    }, 'Date of birth cannot be in the future'),
  address: z.string().trim().max(255, 'Address cannot exceed 255 characters'),
  city: z.string().trim().max(100, 'City cannot exceed 100 characters'),
  state: z.string().trim().max(100, 'State cannot exceed 100 characters'),
  country: z.string().trim().max(100, 'Country cannot exceed 100 characters'),
  postal_code: z.string().trim().max(20, 'Postal code cannot exceed 20 characters'),
  phone: z.string().trim().refine(
    (value) => value === '' || /^\+?[0-9\s()-]{7,20}$/.test(value),
    'Enter a valid phone number',
  ),
  email: z.string().trim()
    .refine((value) => value === '' || z.string().email().safeParse(value).success, 'Enter a valid email address')
    .max(254, 'Email address is too long'),
  profilePhoto: z.object({
    uri: z.string().min(1, 'Invalid photo URI'),
    name: z.string().min(1, 'Photo filename is required'),
    type: z.enum(ALLOWED_PHOTO_TYPES),
  }).nullable(),
  removeProfilePhoto: z.boolean(),
});

function normalizePhotoSelection(value: unknown): PatientPhotoSelection | null {
  if (!value || typeof value !== 'object') return null;

  const photo = value as Partial<PatientPhotoSelection>;
  if (
    typeof photo.uri !== 'string' ||
    photo.uri.length === 0 ||
    typeof photo.name !== 'string' ||
    photo.name.length === 0 ||
    typeof photo.type !== 'string' ||
    !ALLOWED_PHOTO_TYPES.includes(photo.type as (typeof ALLOWED_PHOTO_TYPES)[number])
  ) {
    return null;
  }

  return {
    uri: photo.uri,
    name: photo.name,
    type: photo.type as PatientPhotoSelection['type'],
  };
}

function normalizeDate(value?: string | null): string {
  return value ? value.slice(0, 10) : '';
}

function createDefaultValues(values?: Partial<PatientFormValues>): PatientFormValues {
  return {
    name: values?.name ?? '',
    gender: values?.gender ?? '',
    dob: normalizeDate(values?.dob),
    address: values?.address ?? '',
    city: values?.city ?? '',
    state: values?.state ?? '',
    country: values?.country ?? '',
    postal_code: values?.postal_code ?? '',
    phone: values?.phone ?? '',
    email: values?.email ?? '',
    profilePhoto: normalizePhotoSelection(values?.profilePhoto),
    removeProfilePhoto: values?.removeProfilePhoto ?? false,
  };
}

export default function PatientForm({
  user_id,
  initialPhotoUrl,
  onChange,
  onSubmit,
  initialValues,
  saving = false,
}: Props) {
  const styles = useStyles();
  const COLORS = useAppColors();
  const isEditMode = user_id !== undefined;
  const [photoPermissionError, setPhotoPermissionError] = React.useState<string | null>(null);

  const defaults = React.useMemo(() => createDefaultValues(initialValues), [
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
    initialValues?.profilePhoto,
    initialValues?.removeProfilePhoto,
  ]);

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
  const selectedPhoto = watchedValues.profilePhoto ?? null;
  const removePhoto = watchedValues.removeProfilePhoto ?? false;

  React.useEffect(() => {
    reset(defaults);
  }, [defaults, reset]);

  React.useEffect(() => {
    onChange({
      name: watchedValues.name ?? '',
      gender: watchedValues.gender ?? '',
      dob: watchedValues.dob ?? '',
      address: watchedValues.address ?? '',
      city: watchedValues.city ?? '',
      state: watchedValues.state ?? '',
      country: watchedValues.country ?? '',
      postal_code: watchedValues.postal_code ?? '',
      phone: watchedValues.phone ?? '',
      email: watchedValues.email ?? '',
      profilePhoto: normalizePhotoSelection(watchedValues.profilePhoto),
      removeProfilePhoto: watchedValues.removeProfilePhoto ?? false,
    });
  }, [watchedValues, onChange]);

  const updateField = (field: 'gender', value: string) => {
    setValue(field, value, { shouldDirty: true, shouldValidate: true });
  };

  const choosePhoto = async () => {
    try {
      setPhotoPermissionError(null);
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        setPhotoPermissionError('Photo library permission is required to select a profile photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      if (typeof asset.fileSize === 'number' && asset.fileSize > MAX_PHOTO_SIZE) {
        setPhotoPermissionError('The selected photo must be 5 MB or smaller.');
        return;
      }

      const extension = asset.fileName?.split('.').pop()?.toLowerCase() || 'jpg';
      const mimeType =
        asset.mimeType ||
        (extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg');

      if (!ALLOWED_PHOTO_TYPES.includes(mimeType as (typeof ALLOWED_PHOTO_TYPES)[number])) {
        setPhotoPermissionError('Please select a JPG, PNG or WebP image.');
        return;
      }

      setValue('profilePhoto', {
        uri: asset.uri,
        name: asset.fileName || `patient-profile.${extension}`,
        type: mimeType as PatientPhotoSelection['type'],
      }, { shouldDirty: true, shouldValidate: true });

      setValue('removeProfilePhoto', false, { shouldDirty: true });
    } catch {
      setPhotoPermissionError('Unable to open the photo library. Please try again.');
    }
  };

  const clearPhoto = () => {
    setValue('profilePhoto', null, { shouldDirty: true });
    setValue('removeProfilePhoto', true, { shouldDirty: true });
  };

  const renderField = (
    field: PatientSpecificField,
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
              style={errors[field] ? { borderColor: COLORS.danger } : undefined}
              accessibilityLabel={label}
            />
          )}
        />
      </InlineField>

      {errors[field]?.message ? (
        <AppText variant="error" style={{ marginTop: 2, marginBottom: 4 }}>
          {errors[field]?.message}
        </AppText>
      ) : null}
    </View>
  );

  const photoUri = selectedPhoto?.uri || (!removePhoto ? initialPhotoUrl || undefined : undefined);

  return (
    <View>
      <InlineField label="Profile Photo">
        <View style={{ alignItems: 'center', paddingVertical: 12 }}>
          <View style={{
            width: 116,
            height: 116,
            borderRadius: 16,
            overflow: 'hidden',
            backgroundColor: COLORS.surface,
            borderWidth: 1,
            borderColor: COLORS.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {photoUri ? (
              <Image
                source={{ uri: photoUri }}
                style={{ width: 116, height: 116 }}
                resizeMode="cover"
              />
            ) : (
              <AppText style={{ fontSize: 42 }}>🧑‍⚕️</AppText>
            )}
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            <Pressable
              onPress={choosePhoto}
              disabled={saving}
              style={[
                styles.chipSelected,
                { paddingHorizontal: 16, paddingVertical: 10, opacity: saving ? 0.6 : 1 },
              ]}
            >
              <AppText style={styles.chipTextSelected}>
                {photoUri ? 'Change Photo' : 'Choose Photo'}
              </AppText>
            </Pressable>

            {photoUri ? (
              <Pressable
                onPress={clearPhoto}
                disabled={saving}
                style={[styles.chip, { paddingHorizontal: 16, paddingVertical: 10 }]}
              >
                <AppText style={styles.chipText}>Remove</AppText>
              </Pressable>
            ) : null}
          </View>

          <AppText style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 8 }}>
            JPG, PNG or WebP · Maximum 5 MB
          </AppText>
          {photoPermissionError ? (
            <AppText variant="error" style={{ marginTop: 6 }}>
              {photoPermissionError}
            </AppText>
          ) : null}
        </View>
      </InlineField>

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
                  errors.gender ? { borderColor: COLORS.danger } : {},
                  saving ? { opacity: 0.6 } : {},
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected, disabled: saving }}
              >
                <AppText style={[styles.chipText, selected && styles.chipTextSelected]}>
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

      <DateField
        label="Date of Birth"
        value={watchedValues.dob ?? ''}
        onChange={(value) => {
          setValue('dob', value, {
            shouldDirty: true,
            shouldValidate: true,
          });

          void trigger('dob');
        }}
        maximumDate={new Date()}
        error={errors.dob?.message}
        disabled={saving}
        placeholder="Select date of birth"
      />

      <AddressFields<PatientFormValues>
        control={control}
        errors={errors}
        trigger={trigger}
        saving={saving}
      />

      {renderField('phone', 'Phone', 'Enter phone number', {
        keyboardType: 'phone-pad',
        autoCapitalize: 'none',
      })}
      {renderField('email', 'Email', 'patient@example.com', {
        keyboardType: 'email-address',
        autoCapitalize: 'none',
      })}

      <Pressable
        onPress={() => {
          void handleSubmit(async (values) => {
            try {
              await onSubmit(createDefaultValues(values));
            } catch {
              showAppDialog('Unable to save', 'The patient profile could not be saved. Please try again.');
            }
          })();
        }}
        disabled={saving}
        accessibilityRole="button"
        accessibilityState={{ disabled: saving, busy: saving }}
        style={[
          styles.button,
          { marginTop: 16, marginBottom: 24, opacity: saving ? 0.6 : 1 },
        ]}
      >
        <AppText style={styles.buttonText}>
          {saving ? 'Saving...' : isEditMode ? 'Update Patient Profile' : 'Save Patient Profile'}
        </AppText>
      </Pressable>
    </View>
  );
}
