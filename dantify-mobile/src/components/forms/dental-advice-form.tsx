import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Switch,
  View,
} from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { AppInput } from '@/components/ui/app-input';
import { StatusBadge } from '@/components/ui/status-badge';

import { useStyles } from '@/styles/styles';
import { useAppColors } from '@/hooks/use-app-colors';

import type {
  DentalAdvice,
  CreateDentalAdvicePayload,
} from '@/types/dental-advice';

type DentalAdviceFormValues = {
  name: string;
  description: string;
  default_instructions: string;
  is_active: boolean;
};

type Props = {
  initialValues?: DentalAdvice | null;
  submitLabel: string;
  saving: boolean;
  onSubmit: (payload: CreateDentalAdvicePayload) => void;
  onCancel: () => void;
};

const emptyValues: DentalAdviceFormValues = {
  name: '',
  description: '',
  default_instructions: '',
  is_active: true,
};

function getFormValues(
  advice?: DentalAdvice | null,
): DentalAdviceFormValues {
  if (!advice) return { ...emptyValues };

  return {
    name: advice.name ?? '',
    description: advice.description ?? '',
    default_instructions: advice.default_instructions ?? '',
    is_active: advice.is_active,
  };
}

export default function DentalAdviceForm({
  initialValues,
  submitLabel,
  saving,
  onSubmit,
  onCancel,
}: Props) {
  const styles = useStyles();
  const colors = useAppColors();

  const [values, setValues] = useState<DentalAdviceFormValues>(
    () => getFormValues(initialValues),
  );

  useEffect(() => {
    setValues(getFormValues(initialValues));
  }, [initialValues]);

  const updateField = <K extends keyof DentalAdviceFormValues>(
    field: K,
    value: DentalAdviceFormValues[K],
  ) => {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = () => {
    const name = values.name.trim();
    if (!name) return;

    onSubmit({
      name,
      description: values.description.trim() || null,
      default_instructions:
        values.default_instructions.trim() || null,
      is_active: values.is_active,
    });
  };

  const renderInput = (
    label: string,
    field: keyof Pick<
      DentalAdviceFormValues,
      'name' | 'description' | 'default_instructions'
    >,
    placeholder: string,
    multiline = false,
  ) => (
    <>
      <AppText style={styles.sectionLabel}>{label}</AppText>
      <AppInput
        style={styles.textInput}
        value={values[field]}
        onChangeText={(value) => updateField(field, value)}
        placeholder={placeholder}
        autoCapitalize="sentences"
        multiline={multiline}
        numberOfLines={multiline ? 4 : undefined}
        textAlignVertical={multiline ? 'top' : 'center'}
        editable={!saving}
      />
    </>
  );

  return (
    <ScrollView
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      <AppText variant="title">
        {initialValues ? 'Edit Dental Advice' : 'Add Dental Advice'}
      </AppText>

      <AppText variant="muted">
        Maintain the common dental advice catalogue used across the
        Dantify platform.
      </AppText>

      <View style={styles.card}>
        <AppText style={styles.cardTitle}>
          Dental Advice Information
        </AppText>

        {renderInput(
          'Advice Name *',
          'name',
          'e.g. Brush twice daily',
        )}

        {renderInput(
          'Description',
          'description',
          'Brief description of this dental advice',
          true,
        )}
      </View>

      <View style={styles.card}>
        <AppText style={styles.cardTitle}>
          Instructions
        </AppText>

        {renderInput(
          'Default Instructions',
          'default_instructions',
          'Enter the instructions that can be shared with patients',
          true,
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <AppText style={styles.cardTitle}>
            Availability
          </AppText>

          <StatusBadge
            label={values.is_active ? 'Active' : 'Inactive'}
            variant={values.is_active ? 'success' : 'danger'}
          />
        </View>

        <View style={styles.headerRow}>
          <AppText variant="body">
            Active in Dental Advice Catalogue
          </AppText>

          <Switch
            value={values.is_active}
            onValueChange={(value) =>
              updateField('is_active', value)
            }
            disabled={saving}
            trackColor={{
              false: colors.border,
              true: colors.success,
            }}
            thumbColor={colors.card}
          />
        </View>

        <AppText variant="muted">
          Inactive advice will not be available for new prescription
          selections.
        </AppText>
      </View>

      <View style={styles.actionsRow}>
        <Pressable
          onPress={handleSubmit}
          disabled={saving || !values.name.trim()}
          accessibilityRole="button"
          style={[
            styles.actionButton,
            styles.replyButton,
            (saving || !values.name.trim()) &&
              styles.disabledButton,
          ]}
        >
          {saving ? (
            <ActivityIndicator color={colors.badgeText} />
          ) : (
            <AppText style={styles.actionButtonText}>
              {submitLabel}
            </AppText>
          )}
        </Pressable>

        <Pressable
          onPress={onCancel}
          disabled={saving}
          accessibilityRole="button"
          style={[
            styles.actionButton,
            styles.editButton,
            saving && styles.disabledButton,
          ]}
        >
          <AppText style={styles.actionButtonText}>
            Cancel
          </AppText>
        </Pressable>
      </View>
    </ScrollView>
  );
}