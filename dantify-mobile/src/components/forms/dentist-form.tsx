import React from 'react';
import { Alert, Image, Pressable, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
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

const GENDERS = ['Male', 'Female', 'Other'] as const;

export type DentistPhotoSelection = {
  uri: string;
  name: string;
  type: string;
};

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
  profilePhoto: DentistPhotoSelection | null;
  removeProfilePhoto: boolean;
};

type DentistSpecificField = 'name' | 'gender' | 'phone' | 'email' | 'specialization';

type Props = {
  user_id?: number;
  initialPhotoUrl?: string | null;
  onChange: (values: DentistFormValues) => void;
  onSubmit: (values: DentistFormValues) => void | Promise<void>;
  initialValues?: Partial<DentistFormValues>;
  saving?: boolean;
};

const DentistSchema = z.object({
  name: z.string().trim().min(1, 'Dentist name is required').max(150, 'Name cannot exceed 150 characters'),
  gender: z.string().refine(
    (value) => value === '' || GENDERS.includes(value as (typeof GENDERS)[number]),
    'Select a valid gender',
  ),
  address: z.string().trim().max(255, 'Address cannot exceed 255 characters'),
  city: z.string().trim().max(100, 'City cannot exceed 100 characters'),
  state: z.string().trim().max(100, 'State cannot exceed 100 characters'),
  country: z.string().trim().max(100, 'Country cannot exceed 100 characters'),
  postal_code: z.string().trim().max(20, 'Postal code cannot exceed 20 characters'),
  phone: z.string().trim().refine(
    (value) => value === '' || /^\+?[0-9\s()-]{7,20}$/.test(value),
    'Enter a valid phone number',
  ),
  email: z.string().trim().refine(
    (value) => value === '' || z.string().email().safeParse(value).success,
    'Enter a valid email address',
  ).max(254, 'Email address is too long'),
  specialization: z.string().trim().max(150, 'Specialization cannot exceed 150 characters'),
  profilePhoto: z.custom<DentistPhotoSelection | null>().nullable(),
  removeProfilePhoto: z.boolean(),
});

function createDefaultValues(values?: Partial<DentistFormValues>): DentistFormValues {
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
    profilePhoto: values?.profilePhoto ?? null,
    removeProfilePhoto: values?.removeProfilePhoto ?? false,
  };
}

export default function DentistForm({
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
    initialValues?.name, initialValues?.gender, initialValues?.address,
    initialValues?.city, initialValues?.state, initialValues?.country,
    initialValues?.postal_code, initialValues?.phone, initialValues?.email,
    initialValues?.specialization, initialValues?.profilePhoto,
    initialValues?.removeProfilePhoto,
  ]);

  const {
    control, reset, setValue, trigger, handleSubmit,
    formState: { errors },
  } = useForm<DentistFormValues>({
    resolver: zodResolver(DentistSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: defaults,
  });

  const watchedValues = useWatch({ control });
  const selectedPhoto = watchedValues.profilePhoto ?? null;
  const removePhoto = watchedValues.removeProfilePhoto ?? false;

  React.useEffect(() => { reset(defaults); }, [defaults, reset]);
  React.useEffect(() => { onChange(createDefaultValues(watchedValues)); }, [watchedValues, onChange]);

  const updateField = (field: DentistSpecificField, value: string) => {
    setValue(field, value, { shouldDirty: true, shouldValidate: true });
  };

  const choosePhoto = async () => {
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
    const extension = asset.fileName?.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeType = asset.mimeType || (extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg');

    setValue('profilePhoto', {
      uri: asset.uri,
      name: asset.fileName || `dentist-profile.${extension}`,
      type: mimeType,
    }, { shouldDirty: true });
    setValue('removeProfilePhoto', false, { shouldDirty: true });
  };

  const clearPhoto = () => {
    setValue('profilePhoto', null, { shouldDirty: true });
    setValue('removeProfilePhoto', true, { shouldDirty: true });
  };

  const renderField = (
    field: Exclude<DentistSpecificField, 'gender'>,
    label: string,
    placeholder: string,
    options?: { keyboardType?: 'default' | 'email-address' | 'phone-pad'; autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters' },
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
              onBlur={() => { formField.onBlur(); void trigger(field); }}
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
        <AppText variant="error" style={{ marginTop: 2, marginBottom: 4 }}>{errors[field]?.message}</AppText>
      ) : null}
    </View>
  );

  const photoUri = selectedPhoto?.uri || (!removePhoto ? initialPhotoUrl || undefined : undefined);

  return (
    <View>
      <InlineField label="Profile Photo">
        <View style={{ alignItems: 'center', paddingVertical: 12 }}>
          <View style={{
            width: 116, height: 116, borderRadius: 58, overflow: 'hidden',
            backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
            alignItems: 'center', justifyContent: 'center',
          }}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={{ width: 116, height: 116 }} resizeMode="cover" />
            ) : (
              <AppText style={{ fontSize: 42 }}>👨‍⚕️</AppText>
            )}
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            <Pressable onPress={choosePhoto} disabled={saving} style={[styles.chipSelected, { paddingHorizontal: 16, paddingVertical: 10, opacity: saving ? 0.6 : 1 }]}>
              <AppText style={styles.chipTextSelected}>{photoUri ? 'Change Photo' : 'Choose Photo'}</AppText>
            </Pressable>
            {(photoUri || initialPhotoUrl) ? (
              <Pressable onPress={clearPhoto} disabled={saving} style={[styles.chip, { paddingHorizontal: 16, paddingVertical: 10 }]}>
                <AppText style={styles.chipText}>Remove</AppText>
              </Pressable>
            ) : null}
          </View>
          <AppText style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 8 }}>JPG, PNG or WebP · Maximum 5 MB</AppText>
          {photoPermissionError ? <AppText variant="error" style={{ marginTop: 6 }}>{photoPermissionError}</AppText> : null}
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
                style={[styles.chip, selected && styles.chipSelected, errors.gender ? { borderColor: COLORS.danger } : {}, saving ? { opacity: 0.6 } : {}]}
                accessibilityRole="radio"
                accessibilityState={{ selected, disabled: saving }}
              >
                <AppText style={[styles.chipText, selected && styles.chipTextSelected]}>{gender}</AppText>
              </Pressable>
            );
          })}
        </View>
      </InlineField>
      {errors.gender?.message ? <AppText variant="error" style={{ marginBottom: 8 }}>{errors.gender.message}</AppText> : null}

      {renderField('specialization', 'Specialization', 'e.g. Orthodontics, General Dentistry')}
      <AddressFields<DentistFormValues> control={control} errors={errors} trigger={trigger} saving={saving} />
      {renderField('phone', 'Phone', 'Enter phone number', { keyboardType: 'phone-pad', autoCapitalize: 'none' })}
      {renderField('email', 'Email', 'dentist@example.com', { keyboardType: 'email-address', autoCapitalize: 'none' })}

      <Pressable
        onPress={() => {
          void handleSubmit(async (values) => {
            try { await onSubmit(createDefaultValues(values)); }
            catch { Alert.alert('Unable to save', 'The dentist profile could not be saved. Please try again.'); }
          })();
        }}
        disabled={saving}
        accessibilityRole="button"
        accessibilityState={{ disabled: saving, busy: saving }}
        style={[styles.button, { marginTop: 16, marginBottom: 24, opacity: saving ? 0.6 : 1 }]}
      >
        <AppText style={styles.buttonText}>{saving ? 'Saving...' : isEditMode ? 'Update Dentist Profile' : 'Save Dentist Profile'}</AppText>
      </Pressable>
    </View>
  );
}
