
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { AppText } from '@/components/ui/app-text';
import { AppInput } from '@/components/ui/app-input';
import { StatusBadge } from '@/components/ui/status-badge';

import { useStyles } from '@/styles/styles';

import {
  getAvailableServiceCatalogue,
  getClinicServices,
  addClinicService,
} from '@/services/dental-service';

import type {
  Service,
  ClinicService,
} from '@/types/service';

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

    if (firstError) {
      return firstError;
    }
  }

  return (
    err.response?.data?.message ??
    err.message ??
    'Something went wrong. Please try again.'
  );
}

function formatPrice(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return 'Not set';
  }

  const price = Number(value);

  return Number.isFinite(price)
    ? `₹${price.toFixed(2)}`
    : 'Not set';
}

export default function AddClinicServiceScreen() {
  const router = useRouter();
  const styles = useStyles();

  const [services, setServices] = useState<Service[]>([]);
  const [clinicServices, setClinicServices] = useState<ClinicService[]>([]);

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedService, setSelectedService] =
    useState<Service | null>(null);

  const [clinicPrice, setClinicPrice] = useState('');
  const [clinicDuration, setClinicDuration] = useState('');

  // Load available catalogue services and existing clinic services.
  const loadCatalogue = useCallback(async () => {
    try {
      setError(null);

      const params = {
        search: search.trim() || undefined,
        per_page: 100,
      };

      const [catalogueResult, clinicResult] = await Promise.all([
        getAvailableServiceCatalogue({
          ...params,
          is_active: true,
        }),
        getClinicServices(params),
      ]);

      const existingServices = clinicResult.data;

      // Combine available master services and existing clinic offerings.
      const serviceMap = new Map<number, Service>();

      catalogueResult.data.forEach((service) => {
        serviceMap.set(service.id, service);
      });

      existingServices.forEach((offering) => {
        if (offering.service) {
          serviceMap.set(
            offering.service_id,
            offering.service,
          );
        }
      });

      const sortedServices = Array.from(serviceMap.values()).sort(
        (a, b) => a.name.localeCompare(b.name),
      );

      setServices(sortedServices);
      setClinicServices(existingServices);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  // Debounced search.
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      void loadCatalogue();
    }, 350);

    return () => clearTimeout(timer);
  }, [loadCatalogue]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadCatalogue();
  }, [loadCatalogue]);

  // Select a master service and prefill its default values.
  const selectService = (service: Service) => {
    setSelectedService(service);
    setClinicPrice(
      service.price === null || service.price === undefined
        ? ''
        : String(service.price),
    );
    setClinicDuration(String(service.duration_minutes ?? ''));
  };

  const cancelSelection = () => {
    setSelectedService(null);
    setClinicPrice('');
    setClinicDuration('');
  };

  // Save the clinic-specific service offering.
  const saveClinicService = async () => {
    if (!selectedService || saving) {
      return;
    }

    const price = Number(clinicPrice);
    const duration = Number(clinicDuration);

    if (
      !clinicPrice.trim() ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      Alert.alert(
        'Invalid price',
        'Please enter a valid clinic service price.',
      );
      return;
    }

    if (
      !clinicDuration.trim() ||
      !Number.isInteger(duration) ||
      duration <= 0
    ) {
      Alert.alert(
        'Invalid duration',
        'Please enter a positive whole number of minutes.',
      );
      return;
    }

    try {
      setSaving(true);

      await addClinicService({
        service_id: selectedService.id,
        price,
        duration_minutes: duration,
      });

      const addedName = selectedService.name;

      cancelSelection();

      await loadCatalogue();

      Alert.alert(
        'Service added',
        `${addedName} has been added to your clinic services.`,
      );
    } catch (err) {
      Alert.alert(
        'Unable to add service',
        getErrorMessage(err),
      );
    } finally {
      setSaving(false);
    }
  };

  // Configuration panel displayed above the catalogue.
  const renderConfiguration = () => {
    if (!selectedService) {
      return null;
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <AppText style={styles.cardTitle}>
            Configure Clinic Service
          </AppText>

          <StatusBadge
            label="New"
            variant="info"
          />
        </View>

        <AppText variant="muted">
          {selectedService.name}
        </AppText>

        <View style={styles.phoneRow}>
          <View style={styles.phoneInput}>
            <AppText style={styles.sectionLabel}>
              Clinic Price (₹)
            </AppText>

            <AppInput
              value={clinicPrice}
              onChangeText={setClinicPrice}
              placeholder="Enter price"
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.phoneInput}>
            <AppText style={styles.sectionLabel}>
              Duration (minutes)
            </AppText>

            <AppInput
              value={clinicDuration}
              onChangeText={setClinicDuration}
              placeholder="Minutes"
              keyboardType="number-pad"
            />
          </View>
        </View>

        <AppText variant="muted">
          Catalogue default: {formatPrice(selectedService.price)}
          {' · '}
          {selectedService.duration_minutes ?? 'Not set'} minutes
        </AppText>

        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => void saveClinicService()}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Save clinic service"
            accessibilityState={{
              disabled: saving,
              busy: saving,
            }}
            style={[
              styles.actionButton,
              styles.replyButton,
              saving && styles.disabledButton,
            ]}
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <AppText style={styles.actionButtonText}>
                Save Service
              </AppText>
            )}
          </Pressable>

          <Pressable
            onPress={cancelSelection}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Cancel service configuration"
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
      </View>
    );
  };

  // Individual common catalogue service.
  const renderService = ({ item }: { item: Service }) => {
    const existingOffering = clinicServices.find(
      (offering) => offering.service_id === item.id,
    );

    const isAdded = Boolean(existingOffering);
    const isSelected = selectedService?.id === item.id;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <AppText style={styles.cardTitle}>
            {item.name}
          </AppText>

          <StatusBadge
            label={isAdded ? 'Added' : 'Available'}
            variant={isAdded ? 'success' : 'neutral'}
          />
        </View>

        {!!item.description && (
          <AppText variant="muted">
            {item.description}
          </AppText>
        )}

        <View style={styles.metaRow}>
          <AppText variant="muted">
            Catalogue: {formatPrice(item.price)}
          </AppText>

          <AppText variant="muted">
            {item.duration_minutes ?? 'Not set'} min
          </AppText>
        </View>

        {isAdded ? (
          <AppText variant="muted">
            Your clinic: {formatPrice(existingOffering?.price)}
            {' · '}
            {existingOffering?.duration_minutes ?? 'Not set'} min
          </AppText>
        ) : (
          <View style={styles.actionsRow}>
            <Pressable
              onPress={() => selectService(item)}
              disabled={Boolean(selectedService)}
              accessibilityRole="button"
              accessibilityLabel={`Add ${item.name}`}
              accessibilityState={{
                disabled: Boolean(selectedService),
              }}
              style={[
                styles.actionButton,
                styles.replyButton,
                Boolean(selectedService) && styles.disabledButton,
              ]}
            >
              <AppText style={styles.actionButtonText}>
                {isSelected ? 'Selected' : 'Add Service'}
              </AppText>
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <AppText variant="title">
        Common Service Catalogue
      </AppText>

      <AppText variant="muted">
        Choose services offered by your clinic and configure your
        own price and duration.
      </AppText>

      <AppInput
        style={styles.searchInput}
        value={search}
        onChangeText={setSearch}
        placeholder="Search dental services..."
        returnKeyType="search"
        accessibilityLabel="Search dental services"
      />

      {error && (
        <View style={styles.replyBox}>
          <AppText variant="error">
            {error}
          </AppText>

          <Pressable
            onPress={() => {
              setLoading(true);
              void loadCatalogue();
            }}
            accessibilityRole="button"
          >
            <AppText variant="link">
              Retry
            </AppText>
          </Pressable>
        </View>
      )}

      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" />

          <AppText variant="muted">
            Loading common services...
          </AppText>
        </View>
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderService}
          ListHeaderComponent={renderConfiguration}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <AppText variant="label">
                No services found
              </AppText>

              <AppText variant="muted">
                {search.trim()
                  ? 'Try another search term.'
                  : 'No common services are currently available.'}
              </AppText>
            </View>
          }
          ListFooterComponent={
            <View style={styles.headerRow}>
              <Pressable
                onPress={() => router.back()}
                accessibilityRole="button"
              >
                <AppText variant="link">
                  Back to Our Services
                </AppText>
              </Pressable>
            </View>
          }
        />
      )}
    </View>
  );
}
