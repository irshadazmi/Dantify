import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { useStyles } from '@/styles/styles';
import { useAppColors } from '@/hooks/use-app-colors';

import { AppText } from '@/components/ui/app-text';
import { AppInput } from '@/components/ui/app-input';
import { StatusBadge } from '@/components/ui/status-badge';

import {
  getAvailableDentalServices,
  getClinicServiceOfferings,
  addClinicServiceOffering,
} from '@/services/clinic-service-offering-service';

import type { DentalService } from '@/types/dental-service';
import type { ClinicServiceOffering } from '@/types/clinic-service-offering';
import { ScreenHeader } from '@/components/ui/screen-header';

function getErrorMessage(error: unknown): string {
  const err = error as {
    response?: {
      data?: {
        message?: string;
        errors?: Record<string, string[]>;
      };
    };
    message?: string;
  };

  const validationErrors = err.response?.data?.errors;
  if (validationErrors) {
    const firstError = Object.values(validationErrors)[0]?.[0];
    if (firstError) return firstError;
  }

  return (
    err.response?.data?.message ??
    err.message ??
    'Something went wrong. Please try again.'
  );
}

function formatPrice(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return 'Not set';
  const amount = Number(value);
  return Number.isFinite(amount) ? `₹${amount.toFixed(2)}` : 'Not set';
}

export default function AddClinicServiceScreen() {
  const router = useRouter();
  const styles = useStyles();
  const COLORS = useAppColors();

  const listRef = useRef<FlatList<DentalService>>(null);

  const [catalogue, setCatalogue] = useState<DentalService[]>([]);
  const [clinicOfferings, setClinicOfferings] = useState<ClinicServiceOffering[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedService, setSelectedService] = useState<DentalService | null>(null);
  const [clinicPrice, setClinicPrice] = useState('');
  const [clinicDuration, setClinicDuration] = useState('');
  const [dialog, setDialog] = useState<{
    visible: boolean;
    title: string;
    message: string;
    kind: 'success' | 'error' | 'info';
  }>({
    visible: false,
    title: '',
    message: '',
    kind: 'info',
  });

  const loadCatalogue = useCallback(async () => {
    try {
      setError(null);

      const params = {
        search: search.trim() || undefined,
        per_page: 100,
      };

      const [catalogueResult, offeringResult] = await Promise.all([
        getAvailableDentalServices({ ...params, is_active: true }),
        getClinicServiceOfferings(params),
      ]);

      setCatalogue(catalogueResult.data);
      setClinicOfferings(offeringResult.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      void loadCatalogue();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadCatalogue]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadCatalogue();
  }, [loadCatalogue]);

  const existingOfferingByServiceId = new Map(
    clinicOfferings.map((offering) => [offering.dental_service_id, offering]),
  );

  const selectService = (service: DentalService) => {
    setSelectedService(service);
    setClinicPrice(String(service.price ?? ''));
    setClinicDuration(String(service.duration_minutes ?? ''));
  };

  // The configuration form is the FlatList header. When a service is selected
  // near the bottom of the list, bring that header into view automatically.
  useEffect(() => {
    if (!selectedService) return;

    const frame = requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    });

    return () => cancelAnimationFrame(frame);
  }, [selectedService?.id]);

  const cancelSelection = () => {
    setSelectedService(null);
    setClinicPrice('');
    setClinicDuration('');
  };

  const saveClinicService = async () => {
    if (!selectedService || saving) return;

    const price = Number(clinicPrice);
    const duration = Number(clinicDuration);

    if (!clinicPrice.trim() || !Number.isFinite(price) || price < 0) {
      setDialog({
        visible: true,
        title: 'Invalid price',
        message: 'Enter a valid clinic price (zero or greater).',
        kind: 'error',
      });
      return;
    }

    if (!clinicDuration.trim() || !Number.isInteger(duration) || duration <= 0) {
      setDialog({
        visible: true,
        title: 'Invalid duration',
        message: 'Enter a positive whole number of minutes.',
        kind: 'error',
      });
      return;
    }

    try {
      setSaving(true);
      await addClinicServiceOffering({
        dental_service_id: selectedService.id,
        price,
        duration_minutes: duration,
      });

      const name = selectedService.name;
      cancelSelection();
      await loadCatalogue();
      setDialog({
        visible: true,
        title: 'Service added',
        message: `${name} has been added to your clinic offerings.`,
        kind: 'success',
      });
    } catch (err) {
      setDialog({
        visible: true,
        title: 'Unable to add service',
        message: getErrorMessage(err),
        kind: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const renderConfiguration = () => {
    if (!selectedService) return null;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <AppText style={styles.cardTitle}>Configure Clinic Offering</AppText>
          <StatusBadge label="Selected" variant="info" />
        </View>

        <AppText variant="label">{selectedService.name}</AppText>
        {!!selectedService.description && (
          <AppText variant="muted">{selectedService.description}</AppText>
        )}

        <AppText style={styles.sectionLabel}>Your clinic price (₹)</AppText>
        <AppInput
          style={styles.textInput}
          value={clinicPrice}
          onChangeText={setClinicPrice}
          placeholder="Enter your clinic price"
          keyboardType="decimal-pad"
          editable={!saving}
        />

        <AppText style={styles.sectionLabel}>Appointment duration (minutes)</AppText>
        <AppInput
          style={styles.textInput}
          value={clinicDuration}
          onChangeText={setClinicDuration}
          placeholder="Enter duration in minutes"
          keyboardType="number-pad"
          editable={!saving}
        />

        <AppText variant="muted">
          Common catalogue default: {formatPrice(selectedService.price)} · {selectedService.duration_minutes} minutes
        </AppText>
        <AppText variant="muted">
          These settings apply only to your clinic. The common catalogue will not be changed.
        </AppText>

        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => void saveClinicService()}
            disabled={saving}
            accessibilityRole="button"
            accessibilityState={{ disabled: saving, busy: saving }}
            style={[
              styles.actionButton,
              styles.replyButton,
              saving && styles.disabledButton,
            ]}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.badgeText} />
            ) : (
              <AppText style={styles.actionButtonText}>Add to My Clinic</AppText>
            )}
          </Pressable>

          <Pressable
            onPress={cancelSelection}
            disabled={saving}
            accessibilityRole="button"
            style={[styles.actionButton, styles.editButton]}
          >
            <AppText style={styles.actionButtonText}>Cancel</AppText>
          </Pressable>
        </View>
      </View>
    );
  };

  const renderService = ({ item }: { item: DentalService }) => {
    const existing = existingOfferingByServiceId.get(item.id);
    const alreadyAdded = Boolean(existing);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <AppText style={styles.cardTitle}>{item.name}</AppText>
          <StatusBadge
            label={alreadyAdded ? 'Already added' : 'Available'}
            variant={alreadyAdded ? 'success' : 'neutral'}
          />
        </View>

        {!!item.description && <AppText variant="muted">{item.description}</AppText>}

        <View style={styles.metaRow}>
          <AppText variant="muted">Catalogue: {formatPrice(item.price)}</AppText>
          <AppText variant="muted">{item.duration_minutes} min</AppText>
        </View>

        {alreadyAdded ? (
          <AppText variant="muted">
            Your clinic: {formatPrice(existing?.price)} · {existing?.duration_minutes} min
          </AppText>
        ) : (
          <View style={styles.actionsRow}>
            <Pressable
              onPress={() => selectService(item)}
              disabled={Boolean(selectedService) || saving}
              accessibilityRole="button"
              accessibilityState={{ disabled: Boolean(selectedService) || saving }}
              style={[
                styles.actionButton,
                styles.replyButton,
                (Boolean(selectedService) || saving) && styles.disabledButton,
              ]}
            >
              <AppText style={styles.actionButtonText}>
                {selectedService?.id === item.id ? 'Selected' : 'Select Service'}
              </AppText>
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
    >
    <View style={styles.container}>
      <ScreenHeader
        title="Add Clinic Services"
        subtitle="Select common dental services and set your clinic's price and duration."
        showBack
        onBack={() => router.back()}
      />

      <AppInput
        style={styles.searchInput}
        value={search}
        onChangeText={setSearch}
        placeholder="Search common dental services..."
        returnKeyType="search"
        accessibilityLabel="Search common dental services"
      />

      {!!error && (
        <View style={styles.errorContainer}>
          <AppText variant="error">{error}</AppText>
          <Pressable onPress={() => {
            setLoading(true);
            void loadCatalogue();
          }}>
            <AppText variant="link">Retry</AppText>
          </Pressable>
        </View>
      )}

      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <AppText variant="muted">Loading common dental services...</AppText>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={catalogue}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderService}
          ListHeaderComponent={renderConfiguration}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <AppText variant="label">No common services found</AppText>
              <AppText variant="muted">
                {search.trim()
                  ? 'Try another search term.'
                  : 'There are currently no active services in the common catalogue.'}
              </AppText>
            </View>
          }
        />
      )}

      <Modal
        visible={dialog.visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() =>
          setDialog((current) => ({ ...current, visible: false }))
        }
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.62)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
        >
          <View
            accessibilityRole="alert"
            style={{
              width: '100%',
              maxWidth: 420,
              backgroundColor: COLORS.surface,
              borderColor: COLORS.border,
              borderWidth: 1,
              borderRadius: 20,
              padding: 22,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.25,
              shadowRadius: 18,
              elevation: 12,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14,
                backgroundColor:
                  dialog.kind === 'success'
                    ? COLORS.success
                    : dialog.kind === 'error'
                      ? COLORS.danger
                      : COLORS.primary,
              }}
            >
              <AppText
                style={{
                  color: COLORS.badgeText,
                  fontSize: 25,
                  fontWeight: '800',
                }}
              >
                {dialog.kind === 'success' ? '✓' : dialog.kind === 'error' ? '!' : 'i'}
              </AppText>
            </View>

            <AppText
              style={{
                color: COLORS.text,
                fontSize: 20,
                fontWeight: '800',
                marginBottom: 8,
              }}
            >
              {dialog.title}
            </AppText>

            <AppText
              style={{
                color: COLORS.textSecondary,
                fontSize: 14,
                lineHeight: 21,
              }}
            >
              {dialog.message}
            </AppText>

            <View style={{ alignItems: 'flex-end', marginTop: 22 }}>
              <Pressable
                onPress={() =>
                  setDialog((current) => ({ ...current, visible: false }))
                }
                accessibilityRole="button"
                style={{
                  minWidth: 104,
                  minHeight: 44,
                  paddingHorizontal: 20,
                  borderRadius: 12,
                  backgroundColor: COLORS.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AppText
                  style={{
                    color: COLORS.badgeText,
                    fontWeight: '800',
                    fontSize: 14,
                  }}
                >
                  OK
                </AppText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
    </KeyboardAvoidingView>
  );
}
