
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
  Medicine,
  CreateMedicinePayload,
} from '@/types/medicine';

type MedicineFormValues = {
  name: string;
  generic_name: string;
  composition: string;
  brand_name: string;
  strength: string;
  dosage_form: string;
  manufacturer: string;
  description: string;
  default_instructions: string;
  is_active: boolean;
};

type Props = {
  initialValues?: Medicine | null;
  submitLabel: string;
  saving: boolean;
  onSubmit: (payload: CreateMedicinePayload) => void;
  onCancel: () => void;
};

const emptyValues: MedicineFormValues = {
  name: '',
  generic_name: '',
  composition: '',
  brand_name: '',
  strength: '',
  dosage_form: '',
  manufacturer: '',
  description: '',
  default_instructions: '',
  is_active: true,
};

function getFormValues(
  medicine?: Medicine | null,
): MedicineFormValues {
  if (!medicine) return { ...emptyValues };

  return {
    name: medicine.name ?? '',
    generic_name: medicine.generic_name ?? '',
    composition: medicine.composition ?? '',
    brand_name: medicine.brand_name ?? '',
    strength: medicine.strength ?? '',
    dosage_form: medicine.dosage_form ?? '',
    manufacturer: medicine.manufacturer ?? '',
    description: medicine.description ?? '',
    default_instructions: medicine.default_instructions ?? '',
    is_active: medicine.is_active,
  };
}

export default function MedicineForm({
  initialValues,
  submitLabel,
  saving,
  onSubmit,
  onCancel,
}: Props) {
  const styles = useStyles();
  const colors = useAppColors();

  const [values, setValues] = useState<MedicineFormValues>(
    () => getFormValues(initialValues),
  );

  useEffect(() => {
    setValues(getFormValues(initialValues));
  }, [initialValues]);

  const updateField = <K extends keyof MedicineFormValues>(
    field: K,
    value: MedicineFormValues[K],
  ) => {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = () => {
    const name = values.name.trim();

    if (!name) {
      return;
    }

    onSubmit({
      name,
      generic_name: values.generic_name.trim() || null,
      composition: values.composition.trim() || null,
      brand_name: values.brand_name.trim() || null,
      strength: values.strength.trim() || null,
      dosage_form: values.dosage_form.trim() || null,
      manufacturer: values.manufacturer.trim() || null,
      description: values.description.trim() || null,
      default_instructions:
        values.default_instructions.trim() || null,
      is_active: values.is_active,
    });
  };

  const renderInput = (
    label: string,
    field: keyof MedicineFormValues,
    placeholder: string,
    options?: {
      multiline?: boolean;
      numberOfLines?: number;
      autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    },
  ) => (
    <>
      <AppText style={styles.sectionLabel}>{label}</AppText>
      <AppInput
        style={styles.textInput}
        value={String(values[field])}
        onChangeText={(value) => updateField(field, value)}
        placeholder={placeholder}
        autoCapitalize={options?.autoCapitalize ?? 'sentences'}
        multiline={options?.multiline}
        numberOfLines={options?.numberOfLines}
        textAlignVertical={options?.multiline ? 'top' : 'center'}
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
        {initialValues ? 'Edit Medicine' : 'Add Medicine'}
      </AppText>

      <AppText variant="muted">
        Maintain the common medicine catalogue used across the
        Dantify platform.
      </AppText>

      {/* Basic Information */}
      <View style={styles.card}>
        <AppText style={styles.cardTitle}>
          Medicine Information
        </AppText>

        {renderInput(
          'Medicine Name *',
          'name',
          'e.g. Paracetamol',
          { autoCapitalize: 'words' },
        )}

        {renderInput(
          'Generic Name',
          'generic_name',
          'e.g. Acetaminophen',
          { autoCapitalize: 'words' },
        )}

        {renderInput(
          'Composition',
          'composition',
          'e.g. Paracetamol 500 mg',
        )}

        {renderInput(
          'Brand Name',
          'brand_name',
          'Enter brand name',
          { autoCapitalize: 'words' },
        )}
      </View>

      {/* Product Details */}
      <View style={styles.card}>
        <AppText style={styles.cardTitle}>
          Product Details
        </AppText>

        <View style={styles.phoneRow}>
          <View style={styles.phoneInput}>
            {renderInput(
              'Strength',
              'strength',
              'e.g. 500 mg',
            )}
          </View>

          <View style={styles.phoneInput}>
            {renderInput(
              'Dosage Form',
              'dosage_form',
              'e.g. Tablet',
            )}
          </View>
        </View>

        {renderInput(
          'Manufacturer',
          'manufacturer',
          'Enter manufacturer name',
          { autoCapitalize: 'words' },
        )}
      </View>

      {/* Instructions */}
      <View style={styles.card}>
        <AppText style={styles.cardTitle}>
          Additional Information
        </AppText>

        {renderInput(
          'Description',
          'description',
          'Brief description of the medicine',
          {
            multiline: true,
            numberOfLines: 3,
          },
        )}

        {renderInput(
          'Default Instructions',
          'default_instructions',
          'Default instructions for prescription use',
          {
            multiline: true,
            numberOfLines: 3,
          },
        )}
      </View>

      {/* Availability */}
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
            Active in Medicine Catalogue
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
          Inactive medicines will not be available for new
          prescription selections.
        </AppText>
      </View>

      {/* Actions */}
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
