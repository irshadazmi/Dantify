import React from 'react';
import { Image, Pressable, View } from 'react-native';

import { showAppDialog } from "@/components/ui/app-dialog";
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

export type ClinicPhotoSelection = {
  uri: string;
  name: string;
  type: 'image/jpeg' | 'image/png' | 'image/webp';
};

export type ClinicFormValues = {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  phone: string;
  email: string;
  profilePhoto: ClinicPhotoSelection | null;
  removeProfilePhoto: boolean;
};

type ClinicSpecificField = 'name' | 'phone' | 'email';

type Props = {
  user_id?: number;
  initialPhotoUrl?: string | null;
  onChange: (values: ClinicFormValues) => void;
  onSubmit: (values: ClinicFormValues) => void | Promise<void>;
  initialValues?: Partial<ClinicFormValues>;
  saving?: boolean;
};

const ClinicSchema = z.object({
  name: z.string().trim().min(1, 'Clinic name is required').max(100, 'Name cannot exceed 100 characters'),
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
  profilePhoto: z.object({
    uri: z.string().min(1, 'Invalid photo URI'),
    name: z.string().min(1, 'Photo filename is required'),
    type: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  }).nullable(),
  removeProfilePhoto: z.boolean(),
});

function normalizePhotoSelection(value: unknown): ClinicPhotoSelection | null {
  if (!value || typeof value !== 'object') return null;

  const photo = value as Partial<ClinicPhotoSelection>;

  if (
    typeof photo.uri !== 'string' ||
    photo.uri.length === 0 ||
    typeof photo.name !== 'string' ||
    photo.name.length === 0 ||
    typeof photo.type !== 'string' ||
    photo.type.length === 0
  ) {
    return null;
  }

  return {
    uri: photo.uri,
    name: photo.name,
    type: photo.type,
  };
}

function createDefaultValues(values?: Partial<ClinicFormValues>): ClinicFormValues {
  return {
    name: values?.name ?? '',
    address: values?.address ?? '',
    city: values?.city ?? '',
    state: values?.state ?? '',
    country: values?.country ?? '',
    postal_code: values?.postal_code ?? '',
    phone: values?.phone ?? '',
    email: values?.email ?? '',
    profilePhoto: values?.profilePhoto ?? null,
    removeProfilePhoto: values?.removeProfilePhoto ?? false,
  };
}

export default function ClinicForm({
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
    initialValues?.name, initialValues?.address, initialValues?.city, 
    initialValues?.state, initialValues?.country, initialValues?.postal_code, 
    initialValues?.phone, initialValues?.email,  initialValues?.profilePhoto,
    initialValues?.removeProfilePhoto,
  ]);

  const {
    control, reset, setValue, trigger, handleSubmit,
    formState: { errors },
  } = useForm<ClinicFormValues>({
    resolver: zodResolver(ClinicSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: defaults,
  });

  const watchedValues = useWatch({ control });
  const selectedPhoto = watchedValues.profilePhoto ?? null;
  const removePhoto = watchedValues.removeProfilePhoto ?? false;

  React.useEffect(() => { reset(defaults); }, [defaults, reset]);
  // useWatch may type nested objects as deeply partial. Rebuild a complete,
  // validated form-value shape before notifying the parent component.
  React.useEffect(() => {
    onChange({
      name: watchedValues.name ?? '',
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

  const updateField = (field: ClinicSpecificField, value: string) => {
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

    const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
    if (typeof asset.fileSize === 'number' && asset.fileSize > MAX_PHOTO_SIZE) {
      setPhotoPermissionError('The selected photo must be 5 MB or smaller.');
      return;
    }

    const extension = asset.fileName?.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeType =
      asset.mimeType ||
      (extension === 'png'
        ? 'image/png'
        : extension === 'webp'
          ? 'image/webp'
          : 'image/jpeg');

    if (
      mimeType !== 'image/jpeg' &&
      mimeType !== 'image/png' &&
      mimeType !== 'image/webp'
    ) {
      setPhotoPermissionError('Please select a JPG, PNG or WebP image.');
      return;
    }

    setValue(
      'profilePhoto',
      {
        uri: asset.uri,
        name: asset.fileName || `clinic-profile.${extension}`,
        type: mimeType,
      },
      { shouldDirty: true }
    );
    setValue('removeProfilePhoto', false, { shouldDirty: true });
  };

  const clearPhoto = () => {
    setValue('profilePhoto', null, { shouldDirty: true });
    setValue('removeProfilePhoto', true, { shouldDirty: true });
  };

  const renderField = (
      field: ClinicSpecificField,
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

      <AddressFields<ClinicFormValues> control={control} errors={errors} trigger={trigger} saving={saving} />
      {renderField('phone', 'Phone', 'Enter phone number', { keyboardType: 'phone-pad', autoCapitalize: 'none' })}
      {renderField('email', 'Email', 'clinic@example.com', { keyboardType: 'email-address', autoCapitalize: 'none' })}

      <Pressable
        onPress={() => {
          void handleSubmit(async (values) => {
            try { await onSubmit(createDefaultValues(values)); }
            catch { showAppDialog('Unable to save', 'The clinic profile could not be saved. Please try again.'); }
          })();
        }}
        disabled={saving}
        accessibilityRole="button"
        accessibilityState={{ disabled: saving, busy: saving }}
        style={[styles.button, { marginTop: 16, marginBottom: 24, opacity: saving ? 0.6 : 1 }]}
      >
        <AppText style={styles.buttonText}>{saving ? 'Saving...' : isEditMode ? 'Update Clinic Profile' : 'Save Clinic Profile'}</AppText>
      </Pressable>
    </View>
  );
}
