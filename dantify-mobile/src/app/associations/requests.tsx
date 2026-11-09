
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,

    FlatList,
    Pressable,
    RefreshControl,
    View
} from "react-native";

import { showAppDialog } from "@/components/ui/app-dialog";
import { Stack, useRouter } from "expo-router";

import { useAuth } from "@/contexts/auth-context";
import { useStyles } from "@/styles/styles";
import { useAppColors } from "@/hooks/use-app-colors";
import { AppText } from "@/components/ui/app-text";

import clinicDentistInviteService from "@/services/clinic-dentist-invite-service";

import type {
    ClinicDentistInvite,
    ClinicDentistInviteStatus,
} from "@/types/clinic-dentist-invite";
import { StatusBadge } from "@/components/ui/status-badge";

type FilterStatus = "all" | ClinicDentistInviteStatus;

const FILTERS: { label: string; value: FilterStatus }[] = [
    { label: "All", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Accepted", value: "accepted" },
    { label: "Declined", value: "declined" },
];

function getRoleName(
    role: string | { name: string } | undefined,
): string {
    if (typeof role === "string") {
        return role.toLowerCase();
    }

    return role?.name?.toLowerCase() ?? "";
}

function getErrorMessage(error: unknown): string {
    if (typeof error === "object" && error !== null) {
        const apiError = error as {
            message?: string;
            response?: {
                data?: {
                    message?: string;
                    detail?: string;
                    errors?: Record<string, string | string[]>;
                };
            };
        };

        const data = apiError.response?.data;

        if (data?.errors) {
            const first = Object.values(data.errors)[0];
            const message = Array.isArray(first) ? first[0] : first;
            if (message) return message;
        }

        if (data?.detail) return data.detail;
        if (data?.message) return data.message;
        if (apiError.message) return apiError.message;
    }

    return "Unable to load association requests. Please try again.";
}

function formatDate(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString();
}

function getStatusColor(
    status: ClinicDentistInviteStatus,
    colors: ReturnType<typeof useAppColors>,
): string {
    switch (status) {
        case "pending":
            return colors.warning;
        case "accepted":
            return colors.success;
        case "declined":
            return colors.danger;
        default:
            return colors.textSecondary;
    }
}

export default function AssociationRequestsScreen() {
    const styles = useStyles();
    const colors = useAppColors();
    const router = useRouter();

    const { user, isLoading: authLoading, isAuthenticated } = useAuth();

    const roleName = getRoleName(user?.role);
    const isDentist = roleName === "dentist";
    const isClinic = roleName === "clinic";
    const hasSupportedRole = isDentist || isClinic;

    const [invites, setInvites] = useState<ClinicDentistInvite[]>([]);
    const [filter, setFilter] = useState<FilterStatus>("all");
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const loadInvites = useCallback(
        async (requestedPage: number, refresh = false) => {
            if (!isAuthenticated || !user || !hasSupportedRole) {
                setLoading(false);
                setRefreshing(false);
                return;
            }

            if (refresh) {
                setRefreshing(true);
            } else if (requestedPage === 1) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }

            setError(null);

            try {
                const response = isDentist
                    ? await clinicDentistInviteService.getMyDentistInvites(
                        requestedPage,
                    )
                    : await clinicDentistInviteService.getMyClinicInvites(
                        requestedPage,
                    );

                const pagination = response.data;

                setInvites((current) =>
                    requestedPage === 1
                        ? pagination.data
                        : [...current, ...pagination.data],
                );

                setPage(pagination.current_page);
                setLastPage(pagination.last_page);
                setTotal(pagination.total);
            } catch (loadError) {
                setError(getErrorMessage(loadError));
            } finally {
                setLoading(false);
                setRefreshing(false);
                setLoadingMore(false);
            }
        },
        [hasSupportedRole, isAuthenticated, isDentist, user],
    );

    useEffect(() => {
        if (authLoading) return;

        if (!isAuthenticated || !hasSupportedRole) {
            setLoading(false);
            return;
        }

        void loadInvites(1);
    }, [authLoading, hasSupportedRole, isAuthenticated, loadInvites]);

    const visibleInvites = useMemo(() => {
        if (filter === "all") return invites;

        return invites.filter((invite) => invite.status === filter);
    }, [filter, invites]);

    const pendingCount = invites.filter(
        (invite) => invite.status === "pending",
    ).length;

    const respondToInvite = useCallback(
        (invite: ClinicDentistInvite, response: "accept" | "decline") => {
            showAppDialog(
                response === "accept" ? "Accept request?" : "Decline request?",
                `Are you sure you want to ${response} this association request?`,
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: response === "accept" ? "Accept" : "Decline",
                        style: response === "decline" ? "destructive" : "default",
                        onPress: () => {
                            void (async () => {
                                setProcessingId(invite.id);

                                try {
                                    await clinicDentistInviteService.respondToInvite(
                                        invite.id,
                                        { response },
                                    );

                                    await loadInvites(1, true);

                                    showAppDialog(
                                        "Success",
                                        response === "accept"
                                            ? "Association request accepted. You can configure its schedule separately."
                                            : "Association request declined.",
                                    );
                                } catch (actionError) {
                                    showAppDialog(
                                        "Unable to update request",
                                        getErrorMessage(actionError),
                                    );
                                } finally {
                                    setProcessingId(null);
                                }
                            })();
                        },
                    },
                ],
            );
        },
        [loadInvites],
    );

    const renderInvite = ({ item }: { item: ClinicDentistInvite }) => {
        const clinic = item.clinic;
        const dentist = item.dentist;

        const otherPartyName = isDentist
            ? clinic?.name ?? `Clinic #${item.clinic_id}`
            : dentist?.name ?? `Dentist #${item.dentist_id}`;

        const location = isDentist
            ? [clinic?.city, clinic?.state].filter(Boolean).join(", ")
            : [dentist?.city, dentist?.state].filter(Boolean).join(", ");

        const specialization = !isDentist
            ? dentist?.specialization
            : undefined;

        const isInvitee =
            user != null && item.initiated_by_user_id !== user.id;

        const canRespond = item.status === "pending" && isInvitee;
        const isProcessing = processingId === item.id;

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                        <AppText style={styles.cardTitle}>{otherPartyName}</AppText>
                        <AppText style={styles.issueType}>
                            {isDentist ? "Clinic" : "Dentist"}
                        </AppText>
                    </View>

                    <StatusBadge
                        label={
                            item.status.charAt(0).toUpperCase() +
                            item.status.slice(1)
                        }
                        variant={
                            item.status === 'accepted'
                                ? 'success'
                                : item.status === 'pending'
                                    ? 'warning'
                                    : 'danger'
                        }
                    />
                </View>

                {location ? (
                    <AppText style={styles.text}>Location: {location}</AppText>
                ) : null}

                {specialization ? (
                    <AppText style={styles.text}>
                        Specialization: {specialization}
                    </AppText>
                ) : null}

                <AppText style={styles.metaText}>
                    Requested: {formatDate(item.created_at)}
                </AppText>

                {item.responded_at ? (
                    <AppText style={styles.metaText}>
                        Responded: {formatDate(item.responded_at)}
                    </AppText>
                ) : null}

                {canRespond ? (
                    <View style={[styles.actionsRow, { marginTop: 12 }]}>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Accept association request"
                            accessibilityState={{
                                disabled: isProcessing,
                                busy: isProcessing,
                            }}
                            disabled={isProcessing}
                            onPress={() => respondToInvite(item, "accept")}
                            style={[
                                styles.actionButton,
                                {
                                    backgroundColor: colors.success,
                                    opacity: isProcessing ? 0.6 : 1,
                                    marginLeft: 0,
                                },
                            ]}
                        >
                            {isProcessing ? (
                                <ActivityIndicator color={colors.badgeText} />
                            ) : (
                                <AppText style={styles.actionButtonText}>Accept</AppText>
                            )}
                        </Pressable>

                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Decline association request"
                            accessibilityState={{ disabled: isProcessing }}
                            disabled={isProcessing}
                            onPress={() => respondToInvite(item, "decline")}
                            style={[
                                styles.actionButton,
                                {
                                    backgroundColor: colors.danger,
                                    opacity: isProcessing ? 0.6 : 1,
                                },
                            ]}
                        >
                            <AppText style={styles.actionButtonText}>Decline</AppText>
                        </Pressable>
                    </View>
                ) : null}

                {item.status === "pending" && !isInvitee ? (
                    <AppText style={styles.mutedText}>
                        Waiting for the other party to respond.
                    </AppText>
                ) : null}

                {item.status === "accepted" ? (
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Manage association schedule"
                        onPress={() =>
                            router.push({
                                pathname: "/associations/schedule",
                                params: {
                                    inviteId: String(item.id),
                                },
                            })
                        }
                        style={[
                            styles.button,
                            {
                                marginTop: 12,
                                marginBottom: 0,
                            },
                        ]}
                    >
                        <AppText style={styles.buttonText}>
                            Manage Schedule
                        </AppText>
                    </Pressable>
                ) : null}
            </View>
        );
    };

    if (authLoading || loading) {
        return (
            <View
                style={[
                    styles.container,
                    { flex: 1, alignItems: "center", justifyContent: "center" },
                ]}
            >
                <Stack.Screen options={{ title: "Association Requests" }} />
                <ActivityIndicator size="large" color={colors.primary} />
                <AppText style={[styles.mutedText, { marginTop: 12 }]}>
                    Loading association requests...
                </AppText>
            </View>
        );
    }

    if (!isAuthenticated) {
        return (
            <View
                style={[
                    styles.container,
                    { flex: 1, alignItems: "center", justifyContent: "center" },
                ]}
            >
                <Stack.Screen options={{ title: "Association Requests" }} />
                <AppText style={styles.title}>Login required</AppText>
                <AppText style={styles.description}>
                    Please log in to view association requests.
                </AppText>

                <Pressable
                    style={styles.button}
                    onPress={() => router.replace("/(auth)/login" as never)}
                >
                    <AppText style={styles.buttonText}>Go to Login</AppText>
                </Pressable>
            </View>
        );
    }

    if (!hasSupportedRole) {
        return (
            <View
                style={[
                    styles.container,
                    { flex: 1, alignItems: "center", justifyContent: "center" },
                ]}
            >
                <Stack.Screen options={{ title: "Association Requests" }} />
                <AppText style={styles.title}>Not available for this role</AppText>
                <AppText style={styles.description}>
                    Association requests are available to clinic and dentist accounts.
                </AppText>
            </View>
        );
    }

    return (
        <View style={[styles.container, { flex: 1 }]}>
            <Stack.Screen options={{ title: "Association Requests" }} />

            <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                    <AppText style={[styles.title, { textAlign: "left", marginBottom: 4 }]}>
                        Association Requests
                    </AppText>
                    <AppText style={{ color: colors.textSecondary, fontSize: 13 }}>
                        {isDentist
                            ? "Requests involving your dentist profile"
                            : "Requests involving your clinic"}
                    </AppText>
                </View>
            </View>

            <Pressable
                accessibilityRole="button"
                onPress={() =>
                    router.push(
                        (isClinic
                            ? "/associations/clinic-dentist"
                            : "/associations/dentist-clinic") as never,
                    )
                }
                style={[styles.button, { marginBottom: 12 }]}
            >
                <AppText style={styles.buttonText}>
                    {isClinic ? "+ Add Dentist to Clinic" : "+ Request to Join a Clinic"}
                </AppText>
            </Pressable>

            <View style={[styles.card, { flexDirection: "row", marginBottom: 12 }]}>
                <View style={{ flex: 1, alignItems: "center" }}>
                    <AppText style={[styles.value, { color: colors.primary }]}>
                        {total}
                    </AppText>
                    <AppText style={styles.metaText}>Total requests</AppText>
                </View>

                <View style={{ flex: 1, alignItems: "center" }}>
                    <AppText style={[styles.value, { color: colors.primary }]}>
                        {pendingCount}
                    </AppText>
                    <AppText style={styles.metaText}>Pending on this page</AppText>
                </View>
            </View>

            <View style={[styles.chipsContainer, { flexWrap: "wrap" }]}>
                {FILTERS.map((item) => {
                    const selected = filter === item.value;

                    return (
                        <Pressable
                            key={item.value}
                            accessibilityRole="button"
                            accessibilityState={{ selected }}
                            onPress={() => setFilter(item.value)}
                            style={[
                                styles.chip,
                                selected && styles.chipSelected,
                            ]}
                        >
                            <AppText
                                style={[
                                    styles.chipText,
                                    selected && styles.chipTextSelected,
                                ]}
                            >
                                {item.label}
                            </AppText>
                        </Pressable>
                    );
                })}
            </View>

            {error ? (
                <View
                    accessibilityRole="alert"
                    style={[
                        styles.card,
                        { borderWidth: 1, borderColor: colors.danger },
                    ]}
                >
                    <AppText style={styles.errorText}>{error}</AppText>
                    <Pressable
                        onPress={() => void loadInvites(1, true)}
                        style={[styles.smallButton, { alignSelf: "flex-start" }]}
                    >
                        <AppText style={styles.smallButtonText}>Try again</AppText>
                    </Pressable>
                </View>
            ) : null}

            <FlatList
                data={visibleInvites}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderInvite}
                contentContainerStyle={
                    visibleInvites.length === 0
                        ? { flexGrow: 1, justifyContent: "center", paddingBottom: 24 }
                        : { paddingBottom: 24 }
                }
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => void loadInvites(1, true)}
                        colors={[colors.primary]}
                        tintColor={colors.primary}
                    />
                }

                ListEmptyComponent={
                    !error ? (
                        <View style={{ alignItems: "center", padding: 24 }}>
                            <AppText style={styles.subtitle}>No requests found</AppText>
                            <AppText style={styles.description}>
                                {filter === "all"
                                    ? "Association requests will appear here when available."
                                    : `There are no ${filter} requests on this page.`}
                            </AppText>
                        </View>
                    ) : undefined
                }
                ListFooterComponent={
                    lastPage > page ? (
                        <Pressable
                            disabled={loadingMore}
                            onPress={() => void loadInvites(page + 1)}
                            style={[
                                styles.button,
                                { opacity: loadingMore ? 0.6 : 1 },
                            ]}
                        >
                            {loadingMore ? (
                                <ActivityIndicator color={colors.badgeText} />
                            ) : (
                                <AppText style={styles.buttonText}>Load more</AppText>
                            )}
                        </Pressable>
                    ) : undefined
                }
            />
        </View>
    );
}