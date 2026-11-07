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

const ALLOWED_PHOTO_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

export type LaboratoryPhotoSelection = {
  uri: string;
  name: string;
  type: (typeof ALLOWED_PHOTO_TYPES)[number];
};

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
  profilePhoto: LaboratoryPhotoSelection | null;
  removeProfilePhoto: boolean;
};

type LaboratorySpecificField =
  | 'name'
  | 'contact_person'
  | 'phone'
  | 'email'
  | 'registration_number'
  | 'notes';

type Props = {
  user_id?: number;
  initialPhotoUrl?: string | null;
  onChange: (values: LaboratoryFormValues) => void;
  onSubmit: (values: LaboratoryFormValues) => void | Promise<void>;
  initialValues?: Partial<LaboratoryFormValues>;
  saving?: boolean;
};

const optionalText = (max: number, label: string) =>
  z.string()
    .trim()
    .max(max, `${label} cannot exceed ${max} characters`);

const LaboratorySchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'Laboratory name is required')
    .max(100, 'Name cannot exceed 100 characters'),

  contact_person: optionalText(100, 'Contact person'),

  address: z.string()
    .trim()
    .max(255, 'Address cannot exceed 255 characters'),

  city: z.string()
    .trim()
    .max(100, 'City cannot exceed 100 characters'),

  state: z.string()
    .trim()
    .max(100, 'State cannot exceed 100 characters'),

  country: z.string()
    .trim()
    .max(100, 'Country cannot exceed 100 characters'),

  postal_code: z.string()
    .trim()
    .max(20, 'Postal code cannot exceed 20 characters'),

  phone: z.string().trim().refine(
    (value) => value === '' || /^\+?[0-9\s()-]{7,20}$/.test(value),
    'Enter a valid phone number',
  ),

  email: z.string().trim().refine(
    (value) => value === '' || z.string().email().safeParse(value).success,
    'Enter a valid email address',
  ).max(254, 'Email address is too long'),

  registration_number: optionalText(100, 'Registration number'),

  notes: optionalText(2000, 'Notes'),

  profilePhoto: z.object({
    uri: z.string().min(1, 'Invalid photo URI'),
    name: z.string().min(1, 'Photo filename is required'),
    type: z.enum(ALLOWED_PHOTO_TYPES),
  }).nullable(),

  removeProfilePhoto: z.boolean(),
});

function normalizePhotoSelection(
  value: unknown,
): LaboratoryPhotoSelection | null {
  if (!value || typeof value !== 'object') return null;

  const photo = value as Partial<LaboratoryPhotoSelection>;

  if (
    typeof photo.uri !== 'string' ||
    photo.uri.length === 0 ||
    typeof photo.name !== 'string' ||
    photo.name.length === 0 ||
    typeof photo.type !== 'string' ||
    !ALLOWED_PHOTO_TYPES.includes(
      photo.type as (typeof ALLOWED_PHOTO_TYPES)[number],
    )
  ) {
    return null;
  }

  return {
    uri: photo.uri,
    name: photo.name,
    type: photo.type as LaboratoryPhotoSelection['type'],
  };
}

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
    profilePhoto: normalizePhotoSelection(values?.profilePhoto),
    removeProfilePhoto: values?.removeProfilePhoto ?? false,
  };
}

export default function LaboratoryForm({
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

  const [photoPermissionError, setPhotoPermissionError] =
    React.useState<string | null>(null);

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
      initialValues?.profilePhoto,
      initialValues?.removeProfilePhoto,
    ],
  );

  const {
    control,
    reset,
    setValue,
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

  const selectedPhoto = watchedValues.profilePhoto ?? null;
  const removePhoto = watchedValues.removeProfilePhoto ?? false;

  React.useEffect(() => {
    reset(defaults);
  }, [defaults, reset]);

  // Rebuild a complete form-value object before notifying the parent.
  React.useEffect(() => {
    onChange({
      name: watchedValues.name ?? '',
      contact_person: watchedValues.contact_person ?? '',
      email: watchedValues.email ?? '',
      phone: watchedValues.phone ?? '',
      address: watchedValues.address ?? '',
      city: watchedValues.city ?? '',
      state: watchedValues.state ?? '',
      country: watchedValues.country ?? '',
      postal_code: watchedValues.postal_code ?? '',
      registration_number: watchedValues.registration_number ?? '',
      notes: watchedValues.notes ?? '',
      profilePhoto: normalizePhotoSelection(watchedValues.profilePhoto),
      removeProfilePhoto: watchedValues.removeProfilePhoto ?? false,
    });
  }, [watchedValues, onChange]);

  const choosePhoto = async () => {
    setPhotoPermissionError(null);

    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setPhotoPermissionError(
        'Photo library permission is required to select a laboratory logo.',
      );
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

    if (
      typeof asset.fileSize === 'number' &&
      asset.fileSize > MAX_PHOTO_SIZE
    ) {
      setPhotoPermissionError(
        'The selected photo must be 5 MB or smaller.',
      );
      return;
    }

    const extension =
      asset.fileName?.split('.').pop()?.toLowerCase() || 'jpg';

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
      setPhotoPermissionError(
        'Please select a JPG, PNG or WebP image.',
      );
      return;
    }

    setValue(
      'profilePhoto',
      {
        uri: asset.uri,
        name: asset.fileName || `laboratory-logo.${extension}`,
        type: mimeType,
      },
      { shouldDirty: true },
    );

    setValue('removeProfilePhoto', false, { shouldDirty: true });
  };

  const clearPhoto = () => {
    setValue('profilePhoto', null, { shouldDirty: true });
    setValue('removeProfilePhoto', true, { shouldDirty: true });
  };

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

  // Prefer a newly selected logo; otherwise display the saved logo URL.
  const photoUri =
    selectedPhoto?.uri ||
    (!removePhoto ? initialPhotoUrl || undefined : undefined);

  return (
    <View>
      <InlineField label="Laboratory Logo">
        <View style={{ alignItems: 'center', paddingVertical: 12 }}>
          {/* Square laboratory logo preview. */}
          <View
            style={{
              width: 116,
              height: 116,
              borderRadius: 16,
              overflow: 'hidden',
              backgroundColor: COLORS.surface,
              borderWidth: 1,
              borderColor: COLORS.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {photoUri ? (
              <Image
                source={{ uri: photoUri }}
                style={{ width: 116, height: 116 }}
                resizeMode="cover"
              />
            ) : (
              <AppText style={{ fontSize: 42 }}>🧪</AppText>
            )}
          </View>

          <View
            style={{
              flexDirection: 'row',
              gap: 10,
              marginTop: 12,
            }}
          >
            <Pressable
              onPress={choosePhoto}
              disabled={saving}
              style={[
                styles.chipSelected,
                {
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  opacity: saving ? 0.6 : 1,
                },
              ]}
            >
              <AppText style={styles.chipTextSelected}>
                {photoUri ? 'Change Logo' : 'Choose Logo'}
              </AppText>
            </Pressable>

            {photoUri || initialPhotoUrl ? (
              <Pressable
                onPress={clearPhoto}
                disabled={saving}
                style={[
                  styles.chip,
                  {
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                  },
                ]}
              >
                <AppText style={styles.chipText}>Remove</AppText>
              </Pressable>
            ) : null}
          </View>

          <AppText
            style={{
              color: COLORS.textMuted,
              fontSize: 12,
              marginTop: 8,
            }}
          >
            JPG, PNG or WebP · Maximum 5 MB
          </AppText>

          {photoPermissionError ? (
            <AppText variant="error" style={{ marginTop: 6 }}>
              {photoPermissionError}
            </AppText>
          ) : null}
        </View>
      </InlineField>

      {renderField(
        'name',
        'Laboratory Name',
        'Enter laboratory name',
      )}

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
        {
          autoCapitalize: 'sentences',
          multiline: true,
        },
      )}

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
        'laboratory@example.com',
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
                'The laboratory profile could not be saved. Please try again.',
              );
            }
          })();
        }}
        disabled={saving}
        accessibilityRole="button"
        accessibilityState={{
          disabled: saving,
          busy: saving,
        }}
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
