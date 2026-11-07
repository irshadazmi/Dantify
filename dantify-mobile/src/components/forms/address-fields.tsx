
import React from 'react';
import { View } from 'react-native';
import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormTrigger,
} from 'react-hook-form';

import { InlineField } from '@/components/ui/inline-field';
import { AppInput } from '@/components/ui/app-input';
import { AppText } from '@/components/ui/app-text';
import { useAppColors } from '@/hooks/use-app-colors';
import type { AddressFormValues } from '@/types/address';
import type { FieldError } from 'react-hook-form';

type AddressFieldName = keyof AddressFormValues;

type Props<T extends AddressFormValues> = {
  control: Control<T, any, any>;
  errors: FieldErrors<T>;
  trigger: UseFormTrigger<T>;
  saving?: boolean;
};

const fields: {
  name: AddressFieldName;
  label: string;
  placeholder: string;
  autoCapitalize: 'sentences' | 'words' | 'characters';
}[] = [
    {
      name: 'address',
      label: 'Address',
      placeholder: 'Street / Area',
      autoCapitalize: 'sentences',
    },
    {
      name: 'city',
      label: 'City',
      placeholder: 'Enter city',
      autoCapitalize: 'words',
    },
    {
      name: 'state',
      label: 'State / Province',
      placeholder: 'Enter state or province',
      autoCapitalize: 'words',
    },
    {
      name: 'country',
      label: 'Country',
      placeholder: 'Enter country',
      autoCapitalize: 'words',
    },
    {
      name: 'postal_code',
      label: 'Postal Code / PIN',
      placeholder: 'Enter postal code',
      autoCapitalize: 'characters',
    },
  ];

export default function AddressFields<T extends AddressFormValues>({
  control,
  errors,
  trigger,
  saving = false,
}: Props<T>) {
  const COLORS = useAppColors();

  return (
    <View>
      {fields.map((item) => {
        const fieldName = item.name as keyof T;
        const error = errors[fieldName as keyof typeof errors] as
          | FieldError
          | undefined;

        return (
          <View key={item.name} style={{ marginBottom: 8 }}>
            <InlineField label={item.label}>
              <Controller<T, any, any>
                control={control}
                name={fieldName as any}
                render={({ field }) => (
                  <AppInput
                    value={String(field.value ?? '')}
                    onChangeText={field.onChange}
                    onBlur={() => {
                      field.onBlur();
                      void trigger(fieldName as any);
                    }}
                    placeholder={item.placeholder}
                    autoCapitalize={item.autoCapitalize}
                    autoCorrect={false}
                    editable={!saving}
                    style={
                      error
                        ? { borderColor: COLORS.danger }
                        : undefined
                    }
                    accessibilityLabel={item.label}
                  />
                )}
              />
            </InlineField>

            {error?.message ? (
              <AppText
                variant="error"
                style={{ marginTop: 2, marginBottom: 4 }}
              >
                {String(error.message)}
              </AppText>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
