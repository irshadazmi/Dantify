import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { useAuth } from '@/contexts/auth-context';
import { useStyles } from '@/styles/styles';
import { useAppColors } from '@/hooks/use-app-colors';

import { AppText } from '@/components/ui/app-text';
import { AppInput } from '@/components/ui/app-input';
import { ScreenHeader } from '@/components/ui/screen-header';

import {
  getServices,
  getClinicServices,
  updateServiceStatus,
  updateClinicServiceStatus,
} from '@/services/dental-service';

import type { Service, ClinicService } from '@/types/service';
import { StatusBadge } from '@/components/ui/status-badge';

type ServiceItem = Service | ClinicService;

function getRoleName(
  role: string | { name: string } | undefined,
): string | undefined {
  return typeof role === 'string' ? role : role?.name;
}

function isClinicService(item: ServiceItem): item is ClinicService {
  return 'service' in item;
}

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

export default function ServicesScreen() {
  const router = useRouter();
  const styles = useStyles();
  const COLORS = useAppColors();

  const { user, isLoading: authLoading } = useAuth();

  const roleName = getRoleName(user?.role);
  const isSuperAdmin = roleName === 'superadmin';
  const isClinic = roleName === 'clinic';
  const hasSupportedRole = isSuperAdmin || isClinic;

  const [items, setItems] = useState<ServiceItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadServices = useCallback(async () => {
    if (!hasSupportedRole) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);

      if (isSuperAdmin) {
        const result = await getServices({
          search: search.trim() || undefined,
          per_page: 100,
        });

        setItems(result.data);
      } else {
        const result = await getClinicServices({
          search: search.trim() || undefined,
          per_page: 100,
        });

        setItems(result.data);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hasSupportedRole, isSuperAdmin, search]);

  useEffect(() => {
    if (!authLoading) {
      setLoading(true);
      void loadServices();
    }
  }, [authLoading, loadServices]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadServices();
  }, [loadServices]);

  const handleStatusChange = (item: ServiceItem) => {
    const currentStatus = item.is_active;
    const nextStatus = !currentStatus;

    const serviceName = isClinicService(item)
      ? item.service.name
      : item.name;

    Alert.alert(
      `${nextStatus ? 'Activate' : 'Deactivate'} service`,
      `Are you sure you want to ${nextStatus ? 'activate' : 'deactivate'
      } "${serviceName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: nextStatus ? 'Activate' : 'Deactivate',
          style: nextStatus ? 'default' : 'destructive',
          onPress: async () => {
            try {
              setUpdatingId(item.id);

              if (isSuperAdmin) {
                await updateServiceStatus(item.id, nextStatus);
              } else {
                await updateClinicServiceStatus(item.id, nextStatus);
              }

              await loadServices();
            } catch (err) {
              Alert.alert('Unable to update status', getErrorMessage(err));
            } finally {
              setUpdatingId(null);
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: ServiceItem }) => {
    const clinicOffering = isClinicService(item);
    const service = clinicOffering ? item.service : item;

    const price = clinicOffering ? item.price : service.price;
    const duration = clinicOffering
      ? item.duration_minutes
      : service.duration_minutes;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={localStyles.serviceInfo}>
            <AppText style={styles.cardTitle}>
              {service.name}
            </AppText>

            {!!service.description && (
              <AppText variant="muted">
                {service.description}
              </AppText>
            )}
          </View>

          <StatusBadge
            label={item.is_active ? 'Active' : 'Inactive'}
            variant={item.is_active ? 'success' : 'danger'}
          />
        </View>

        <View style={localStyles.details}>
          <View style={localStyles.detailItem}>
            <AppText variant="muted">Price</AppText>
            <AppText variant="label">
              ₹{Number(price).toFixed(2)}
            </AppText>
          </View>

          <View style={localStyles.detailItem}>
            <AppText variant="muted">Duration</AppText>
            <AppText variant="label">
              {duration} minutes
            </AppText>
          </View>
        </View>

        <View style={[styles.actionsRow, localStyles.actions]}>
          <Pressable
            onPress={() => {
              if (isSuperAdmin) {
                router.push(`/services/${item.id}/edit`);
              } else {
                router.push(`/services/clinic/${item.id}/edit`);
              }
            }}
            style={[
              styles.actionButton,
              styles.editButton,
            ]}
          >
            <AppText style={styles.actionButtonText}>Edit</AppText>
          </Pressable>

          <Pressable
            disabled={updatingId === item.id}
            onPress={() => handleStatusChange(item)}
            style={[
              styles.actionButton,
              {
                backgroundColor: item.is_active
                  ? COLORS.danger
                  : COLORS.success,
                opacity: updatingId === item.id ? 0.6 : 1,
              },
            ]}
          >
            {updatingId === item.id ? (
              <ActivityIndicator
                size="small"
                color={COLORS.badgeText}
              />
            ) : (
              <AppText style={styles.actionButtonText}>
                {item.is_active ? 'Deactivate' : 'Activate'}
              </AppText>
            )}
          </Pressable>
        </View>
      </View>
    );
  };

  if (authLoading) {
    return (
      <View style={[styles.container, localStyles.center]}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  if (!hasSupportedRole) {
    return (
      <View style={styles.container}>
        <AppText variant="title">Services</AppText>
        <AppText variant="muted">
          Services management is currently available to Super Admin
          and Clinic accounts.
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={isSuperAdmin ? 'Services' : 'Our Services'}
        subtitle={
          isSuperAdmin
            ? 'Manage the common dental service catalogue.'
            : 'Manage the services offered by your clinic.'
        }
        count={items.length}
        actionTitle={isSuperAdmin ? 'Add Service' : 'Add Service'}
        onAction={() => {
          if (isSuperAdmin) {
            router.push('/services/create');
          } else {
            router.push('/services/clinic/add');
          }
        }}
      />

      <AppInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search services..."
        returnKeyType="search"
        accessibilityLabel="Search services"
      />

      {error && (
        <View style={localStyles.errorBox}>
          <AppText variant="error">{error}</AppText>
          <Pressable onPress={() => void loadServices()}>
            <AppText variant="link">Retry</AppText>
          </Pressable>
        </View>
      )}

      {loading ? (
        <View style={localStyles.center}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <AppText variant="muted">Loading services...</AppText>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={
            items.length === 0
              ? localStyles.emptyList
              : localStyles.listContent
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={localStyles.center}>
              <AppText variant="label">
                No services found
              </AppText>
              <AppText variant="muted">
                {search.trim()
                  ? 'Try a different search term.'
                  : isSuperAdmin
                    ? 'Add your first common service.'
                    : 'Add services from the common catalogue.'}
              </AppText>
            </View>
          }
        />
      )}
    </View>
  );
}

const localStyles = StyleSheet.create({
  serviceInfo: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  details: {
    flexDirection: 'row',
    gap: 28,
    marginTop: 10,
    marginBottom: 8,
  },
  detailItem: {
    gap: 3,
  },
  actions: {
    marginTop: 8,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 10,
  },
  listContent: {
    paddingBottom: 30,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  errorBox: {
    padding: 10,
    marginBottom: 10,
    gap: 6,
  },
});