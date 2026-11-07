
import React, {
    useCallback,
    useEffect,
    useState,
} from 'react';

import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    View,
} from 'react-native';

import { useRouter } from 'expo-router';

import { AppText } from '@/components/ui/app-text';
import { AppInput } from '@/components/ui/app-input';
import { StatusBadge } from '@/components/ui/status-badge';

import { useAuth } from '@/contexts/auth-context';
import { useStyles } from '@/styles/styles';
import { useAppColors } from '@/hooks/use-app-colors';

import {
    getDentalServices,
    updateDentalServiceStatus,
} from '@/services/dental-service-service';

import type { DentalService } from '@/types/dental-service';

/* ======================================================
   HELPERS
====================================================== */

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

    const number = Number(value);

    return Number.isFinite(number)
        ? `₹${number.toFixed(2)}`
        : 'Not set';
}

/* ======================================================
   SCREEN
====================================================== */

export default function DentalServicesScreen() {
    const router = useRouter();
    const styles = useStyles();
    const colors = useAppColors();

    const {
        user,
        isLoading: authLoading,
    } = useAuth();

    const roleName =
        typeof user?.role === 'string'
            ? user.role
            : user?.role?.name;

    const isSuperAdmin = roleName === 'superadmin';

    const [services, setServices] = useState<DentalService[]>([]);
    const [search, setSearch] = useState('');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    /* ----------------------------------------------------
       LOAD SERVICES
    ---------------------------------------------------- */

    const loadServices = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const result = await getDentalServices({
                search: search.trim() || undefined,
                page: 1,
                per_page: 50,
            });

            setServices(result.data);
        } catch (err) {
            setError(getErrorMessage(err));
            setServices([]);
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        if (!authLoading && isSuperAdmin) {
            const timeout = setTimeout(() => {
                void loadServices();
            }, 350);

            return () => clearTimeout(timeout);
        }
    }, [authLoading, isSuperAdmin, loadServices]);

    /* ----------------------------------------------------
       STATUS CHANGE
    ---------------------------------------------------- */

    const handleStatusChange = (service: DentalService) => {
        if (updatingId !== null) {
            return;
        }

        const nextStatus = !service.is_active;

        Alert.alert(
            `${nextStatus ? 'Activate' : 'Deactivate'} service`,
            `Are you sure you want to ${nextStatus ? 'activate' : 'deactivate'
            } "${service.name}"?`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: nextStatus ? 'Activate' : 'Deactivate',
                    style: nextStatus ? 'default' : 'destructive',
                    onPress: () => {
                        void updateStatus(service, nextStatus);
                    },
                },
            ],
        );
    };

    const updateStatus = async (
        service: DentalService,
        isActive: boolean,
    ) => {
        try {
            setUpdatingId(service.id);

            await updateDentalServiceStatus(service.id, isActive);

            setServices((current) =>
                current.map((item) =>
                    item.id === service.id
                        ? { ...item, is_active: isActive }
                        : item,
                ),
            );
        } catch (err) {
            Alert.alert(
                'Unable to update service status',
                getErrorMessage(err),
            );
        } finally {
            setUpdatingId(null);
        }
    };

    /* ----------------------------------------------------
       AUTHORIZATION
    ---------------------------------------------------- */

    if (authLoading) {
        return (
            <View style={styles.container}>
                <View style={styles.emptyState}>
                    <ActivityIndicator
                        size="large"
                        color={colors.primary}
                    />
                </View>
            </View>
        );
    }

    if (!isSuperAdmin) {
        return (
            <View style={styles.container}>
                <View style={styles.emptyState}>
                    <AppText variant="title">
                        Access restricted
                    </AppText>

                    <AppText variant="muted">
                        Only Super Admin can manage the master dental service catalogue.
                    </AppText>
                </View>
            </View>
        );
    }

    /* ----------------------------------------------------
       RENDER
    ---------------------------------------------------- */

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.screenHeader}>
                    <View style={styles.screenHeaderContent}>
                        <AppText variant="title">
                            Dental Services
                        </AppText>

                        <AppText variant="muted">
                            Manage the master dental service catalogue.
                            Clinics can select these services and configure
                            their own pricing and duration.
                        </AppText>
                    </View>

                    <Pressable
                        onPress={() => router.push('/dental-services/create')}
                        accessibilityRole="button"
                        accessibilityLabel="Add dental service"
                        style={styles.smallButton}
                    >
                        <AppText style={styles.smallButtonText}>
                            + Add
                        </AppText>
                    </Pressable>
                </View>

                <AppInput
                    style={styles.searchInput}
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search dental services..."
                    autoCapitalize="none"
                    returnKeyType="search"
                />

                {loading ? (
                    <View style={styles.emptyState}>
                        <ActivityIndicator
                            size="large"
                            color={colors.primary}
                        />

                        <AppText variant="muted">
                            Loading dental services...
                        </AppText>
                    </View>
                ) : error ? (
                    <View style={styles.emptyState}>
                        <AppText variant="title">
                            Unable to load services
                        </AppText>

                        <AppText variant="error">
                            {error}
                        </AppText>

                        <Pressable
                            onPress={() => void loadServices()}
                            accessibilityRole="button"
                            style={[
                                styles.actionButton,
                                styles.replyButton,
                            ]}
                        >
                            <AppText style={styles.actionButtonText}>
                                Retry
                            </AppText>
                        </Pressable>
                    </View>
                ) : services.length === 0 ? (
                    <View style={styles.emptyState}>
                        <AppText variant="title">
                            No dental services found
                        </AppText>

                        <AppText variant="muted">
                            {search.trim()
                                ? 'Try another search term.'
                                : 'Add your first service to the master catalogue.'}
                        </AppText>

                        {!search.trim() && (
                            <Pressable
                                onPress={() => router.push('/dental-services/create')}
                                accessibilityRole="button"
                                style={[
                                    styles.actionButton,
                                    styles.replyButton,
                                ]}
                            >
                                <AppText style={styles.actionButtonText}>
                                    Add Dental Service
                                </AppText>
                            </Pressable>
                        )}
                    </View>
                ) : (
                    <>
                        <AppText variant="muted">
                            {services.length} service
                            {services.length === 1 ? '' : 's'} displayed
                        </AppText>

                        {services.map((service) => {
                            const isUpdating = updatingId === service.id;

                            return (
                                <View
                                    key={service.id}
                                    style={styles.card}
                                >
                                    <View style={styles.cardHeader}>
                                        <View style={styles.screenHeaderContent}>
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
                                            label={service.is_active ? 'Active' : 'Inactive'}
                                            variant={service.is_active ? 'success' : 'danger'}
                                        />
                                    </View>

                                    <View style={styles.serviceDetails}>
                                        <View style={styles.serviceDetailItem}>
                                            <AppText variant="muted">
                                                Default Price
                                            </AppText>

                                            <AppText variant="label">
                                                {formatPrice(service.price)}
                                            </AppText>
                                        </View>

                                        <View style={styles.serviceDetailItem}>
                                            <AppText variant="muted">
                                                Default Duration
                                            </AppText>

                                            <AppText variant="label">
                                                {service.duration_minutes} minutes
                                            </AppText>
                                        </View>
                                    </View>

                                    <View style={styles.actionsRow}>
                                        <Pressable
                                            onPress={() =>
                                                router.push({
                                                    pathname: '/(superadmin)/dental-services/[id]/edit',
                                                    params: { id: String(service.id) },
                                                })
                                            }
                                            accessibilityRole="button"
                                            style={[styles.actionButton, styles.editButton]}
                                        >
                                            <AppText style={styles.actionButtonText}>
                                                Edit
                                            </AppText>
                                        </Pressable>

                                        <Pressable
                                            disabled={isUpdating || updatingId !== null}
                                            onPress={() => handleStatusChange(service)}
                                            accessibilityRole="button"
                                            style={[
                                                styles.actionButton,
                                                service.is_active
                                                    ? styles.deleteButton
                                                    : styles.replyButton,
                                                (isUpdating || updatingId !== null) &&
                                                styles.disabledButton,
                                            ]}
                                        >
                                            {isUpdating ? (
                                                <ActivityIndicator
                                                    size="small"
                                                    color={colors.badgeText}
                                                />
                                            ) : (
                                                <AppText style={styles.actionButtonText}>
                                                    {service.is_active ? 'Deactivate' : 'Activate'}
                                                </AppText>
                                            )}
                                        </Pressable>
                                    </View>
                                </View>
                            );
                        })}
                    </>
                )}
            </ScrollView>
        </View>
    );
}
