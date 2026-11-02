
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    TextInput,
    View,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";

import { useAuth } from "@/contexts/auth-context";
import { useStyles } from "@/styles/styles";
import { useAppColors } from "@/hooks/use-app-colors";
import { AppText } from "@/components/ui/app-text";

import associationScheduleService from "@/services/association-schedule-service";
import { formatDateOnly, formatTimestamp, parseDateOnly, toDateOnly } from "@/utils/date-time";

import type {
    AssociationSchedule,
    AssociationScheduleStatus,
    DayOfWeek,
    ScheduleSlotPayload,
} from "@/types/association-schedule";

const DAYS: DayOfWeek[] = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
];

const DEFAULT_START = "09:00";
const DEFAULT_END = "17:00";

type EditableSlot = ScheduleSlotPayload & {
    localId: string;
};

function getErrorMessage(error: unknown): string {
    if (typeof error === "object" && error !== null) {
        const apiError = error as {
            message?: string;
            response?: {
                data?: {
                    message?: string;
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

        if (data?.message) return data.message;
        if (apiError.message) return apiError.message;
    }

    return "Something went wrong. Please try again.";
}

function statusLabel(status: AssociationScheduleStatus): string {
    const labels: Record<AssociationScheduleStatus, string> = {
        proposed: "Awaiting review",
        confirmed: "Confirmed",
        change_requested: "Changes requested",
        cancelled: "Cancelled",
        superseded: "Previous version",
    };

    return labels[status];
}

export default function AssociationScheduleScreen() {
    const styles = useStyles();
    const colors = useAppColors();
    const router = useRouter();

    const { inviteId } = useLocalSearchParams<{
        inviteId: string;
    }>();

    const { user, isLoading: authLoading, isAuthenticated } = useAuth();

    const associationId = Number(inviteId);
    const currentUserId = Number(user?.id);

    const [schedules, setSchedules] = useState<AssociationSchedule[]>([]);
    const [slots, setSlots] = useState<EditableSlot[]>([]);

    const [effectiveFrom, setEffectiveFrom] = useState("");
    const [effectiveUntil, setEffectiveUntil] = useState("");
    const [showEffectiveFromPicker, setShowEffectiveFromPicker] = useState(false);
    const [showEffectiveUntilPicker, setShowEffectiveUntilPicker] = useState(false);
    const [notes, setNotes] = useState("");

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [dialog, setDialog] = useState<{
        title: string;
        message: string;
        confirmLabel?: string;
        destructive?: boolean;
        onConfirm?: () => void | Promise<void>;
    } | null>(null);

    // Refs prevent rapid repeated taps before React has rendered disabled states.
    const submitLock = useRef(false);
    const actionLock = useRef<number | null>(null);


    const confirmedSchedule = useMemo(
        () => schedules.find((item) => item.status === "confirmed"),
        [schedules],
    );

    const pendingProposal = useMemo(
        () => schedules.find((item) => item.status === "proposed"),
        [schedules],
    );

    const loadSchedules = useCallback(async (refresh = false) => {
        if (!Number.isInteger(associationId) || associationId <= 0) {
            setError("Invalid association ID.");
            setLoading(false);
            return;
        }

        if (refresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setError(null);

        try {
            const response =
                await associationScheduleService.getSchedules(associationId);

            setSchedules(response.data.data);
        } catch (loadError) {
            setError(getErrorMessage(loadError));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [associationId]);

    useEffect(() => {
        if (authLoading) return;

        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        void loadSchedules();
    }, [authLoading, isAuthenticated, loadSchedules]);

    const addSlot = (day: DayOfWeek) => {
        setSlots((current) => [
            ...current,
            {
                localId: `${Date.now()}-${Math.random()}`,
                day_of_week: day,
                start_time: DEFAULT_START,
                end_time: DEFAULT_END,
            },
        ]);
    };

    const updateSlot = (
        localId: string,
        field: "start_time" | "end_time",
        value: string,
    ) => {
        setSlots((current) =>
            current.map((slot) =>
                slot.localId === localId
                    ? { ...slot, [field]: value }
                    : slot,
            ),
        );
    };

    const removeSlot = (localId: string) => {
        setSlots((current) =>
            current.filter((slot) => slot.localId !== localId),
        );
    };

    const handleEffectiveFromChange = (event: DateTimePickerEvent, date?: Date) => {
        if (event.type === "dismissed") {
            setShowEffectiveFromPicker(false);
            return;
        }
        if (date) {
            const value = toDateOnly(date);
            setEffectiveFrom(value);
            if (effectiveUntil && effectiveUntil < value) {
                setEffectiveUntil("");
            }
        }
        setShowEffectiveFromPicker(false);
    };

    const handleEffectiveUntilChange = (event: DateTimePickerEvent, date?: Date) => {
        if (event.type === "dismissed") {
            setShowEffectiveUntilPicker(false);
            return;
        }
        if (date) setEffectiveUntil(toDateOnly(date));
        setShowEffectiveUntilPicker(false);
    };

    const showMessage = (title: string, message: string) => {
        setDialog({ title, message });
    };

    const submitProposal = async () => {
        if (submitLock.current || submitting) return;

        if (!effectiveFrom.trim()) {
            showMessage("Required", "Please select the effective start date.");
            return;
        }

        if (effectiveUntil && effectiveUntil < effectiveFrom) {
            showMessage(
                "Invalid date range",
                "The effective end date cannot be earlier than the start date.",
            );
            return;
        }

        if (slots.length === 0) {
            showMessage(
                "Working days required",
                "Add at least one working-day time slot.",
            );
            return;
        }

        submitLock.current = true;
        setSubmitting(true);

        try {
            await associationScheduleService.createSchedule(
                associationId,
                {
                    effective_from: effectiveFrom.trim(),
                    effective_until: effectiveUntil.trim() || null,
                    notes: notes.trim() || null,
                    slots: slots.map(({ localId, ...slot }) => slot),
                },
            );

            setSlots([]);
            setEffectiveFrom("");
            setEffectiveUntil("");
            setNotes("");

            await loadSchedules(true);

            showMessage(
                "Proposal submitted",
                "Your schedule proposal has been sent to the other party for review.",
            );
        } catch (submitError) {
            showMessage(
                "Unable to submit schedule",
                getErrorMessage(submitError),
            );
        } finally {
            submitLock.current = false;
            setSubmitting(false);
        }
    };

    const performReview = async (
        schedule: AssociationSchedule,
        response: "confirm" | "request_changes",
    ) => {
        if (actionLock.current !== null) return;

        actionLock.current = schedule.id;
        setProcessingId(schedule.id);
        setDialog(null);

        try {
            await associationScheduleService.reviewSchedule(
                schedule.id,
                response,
            );

            await loadSchedules(true);

            showMessage(
                "Success",
                response === "confirm"
                    ? "The association schedule is now confirmed."
                    : "Changes have been requested.",
            );
        } catch (actionError) {
            showMessage(
                "Unable to review schedule",
                getErrorMessage(actionError),
            );
        } finally {
            actionLock.current = null;
            setProcessingId(null);
        }
    };

    const reviewProposal = (
        schedule: AssociationSchedule,
        response: "confirm" | "request_changes",
    ) => {
        if (actionLock.current !== null || processingId !== null) return;

        const isConfirm = response === "confirm";

        setDialog({
            title: isConfirm ? "Confirm schedule?" : "Request changes?",
            message: isConfirm
                ? "Confirm this working schedule for the association?"
                : "Send this proposal back for changes?",
            confirmLabel: isConfirm ? "Confirm" : "Request changes",
            destructive: !isConfirm,
            onConfirm: () => performReview(schedule, response),
        });
    };

    const performCancel = async (schedule: AssociationSchedule) => {
        if (actionLock.current !== null) return;

        actionLock.current = schedule.id;
        setProcessingId(schedule.id);
        setDialog(null);

        try {
            await associationScheduleService.cancelSchedule(schedule.id);
            await loadSchedules(true);
            showMessage("Proposal cancelled", "The schedule proposal has been cancelled.");
        } catch (actionError) {
            showMessage(
                "Unable to cancel proposal",
                getErrorMessage(actionError),
            );
        } finally {
            actionLock.current = null;
            setProcessingId(null);
        }
    };

    const cancelProposal = (schedule: AssociationSchedule) => {
        if (actionLock.current !== null || processingId !== null) return;

        setDialog({
            title: "Cancel proposal?",
            message: "Are you sure you want to cancel this schedule proposal?",
            confirmLabel: "Cancel proposal",
            destructive: true,
            onConfirm: () => performCancel(schedule),
        });
    };

    const renderSlots = (scheduleSlots: {
        id?: number;
        day_of_week: DayOfWeek;
        start_time: string;
        end_time: string;
    }[]) => {
        return DAYS.map((day) => {
            const daySlots = scheduleSlots.filter(
                (slot) => slot.day_of_week === day,
            );

            if (daySlots.length === 0) return null;

            return (
                <View key={day} style={{ marginBottom: 8 }}>
                    <AppText style={styles.sectionLabel}>{day}</AppText>

                    {daySlots.map((slot, index) => (
                        <AppText
                            key={slot.id ?? `${day}-${index}`}
                            style={styles.text}
                        >
                            {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
                        </AppText>
                    ))}
                </View>
            );
        });
    };

    const renderSchedule = (schedule: AssociationSchedule) => {
        const isProposer =
            schedule.proposed_by_user_id === currentUserId;

        const canReview =
            schedule.status === "proposed" && !isProposer;

        const canCancel =
            isProposer &&
            (schedule.status === "proposed" ||
                schedule.status === "change_requested");

        const isProcessing = processingId === schedule.id;

        const statusColor =
            schedule.status === "confirmed"
                ? colors.success
                : schedule.status === "proposed"
                    ? colors.warning
                    : schedule.status === "cancelled"
                        ? colors.danger
                        : colors.textSecondary;

        return (
            <View key={schedule.id} style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                        <AppText style={styles.cardTitle}>
                            Schedule #{schedule.id}
                        </AppText>
                        <AppText style={styles.metaText}>
                            Proposed {formatTimestamp(schedule.created_at)}
                        </AppText>
                    </View>

                    <View
                        style={[
                            styles.statusBadge,
                            {
                                backgroundColor: colors.card,
                                borderWidth: 1,
                                borderColor: statusColor,
                            },
                        ]}
                    >
                        <AppText style={[styles.statusText, { color: statusColor }]}>
                            {statusLabel(schedule.status)}
                        </AppText>
                    </View>
                </View>

                <AppText style={styles.text}>
                    Effective from: {formatDateOnly(schedule.effective_from)}
                </AppText>

                {schedule.effective_until ? (
                    <AppText style={styles.text}>
                        Effective until: {formatDateOnly(schedule.effective_until)}
                    </AppText>
                ) : null}

                <View style={{ marginTop: 8 }}>
                    {renderSlots(schedule.slots)}
                </View>

                {schedule.notes ? (
                    <View style={styles.replyBox}>
                        <AppText style={styles.replyLabel}>Notes</AppText>
                        <AppText style={styles.replyText}>{schedule.notes}</AppText>
                    </View>
                ) : null}

                {schedule.proposed_by?.name ? (
                    <AppText style={styles.metaText}>
                        Proposed by: {schedule.proposed_by.name}
                    </AppText>
                ) : null}

                {schedule.reviewed_at ? (
                    <AppText style={styles.metaText}>
                        Reviewed: {formatTimestamp(schedule.reviewed_at)}
                    </AppText>
                ) : null}

                {canReview ? (
                    <View style={[styles.actionsRow, { marginTop: 12 }]}>
                        <Pressable
                            disabled={isProcessing}
                            onPress={() => reviewProposal(schedule, "confirm")}
                            style={[
                                styles.actionButton,
                                {
                                    backgroundColor: colors.success,
                                    marginLeft: 0,
                                    opacity: isProcessing ? 0.5 : 1,
                                },
                            ]}
                        >
                            <AppText style={styles.actionButtonText}>
                                Confirm
                            </AppText>
                        </Pressable>

                        <Pressable
                            disabled={isProcessing}
                            onPress={() =>
                                reviewProposal(schedule, "request_changes")
                            }
                            style={[
                                styles.actionButton,
                                {
                                    backgroundColor: colors.warning,
                                    opacity: isProcessing ? 0.5 : 1,
                                },
                            ]}
                        >
                            <AppText style={styles.actionButtonText}>
                                Request changes
                            </AppText>
                        </Pressable>
                    </View>
                ) : null}

                {canCancel ? (
                    <Pressable
                        disabled={isProcessing}
                        onPress={() => cancelProposal(schedule)}
                        style={[
                            styles.smallButton,
                            {
                                alignSelf: "flex-start",
                                marginTop: 12,
                                backgroundColor: colors.danger,
                                opacity: isProcessing ? 0.5 : 1,
                            },
                        ]}
                    >
                        <AppText style={styles.smallButtonText}>
                            Cancel proposal
                        </AppText>
                    </Pressable>
                ) : null}
            </View>
        );
    };

    if (authLoading || loading) {
        return (
            <View style={[styles.container, {
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
            }]}>
                <Stack.Screen options={{ title: "Association Schedule" }} />
                <ActivityIndicator size="large" color={colors.primary} />
                <AppText style={[styles.mutedText, { marginTop: 12 }]}>
                    Loading schedules...
                </AppText>
            </View>
        );
    }

    if (!isAuthenticated) {
        return (
            <View style={[styles.container, {
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
            }]}>
                <Stack.Screen options={{ title: "Association Schedule" }} />
                <AppText style={styles.title}>Login required</AppText>
                <AppText style={styles.description}>
                    Please log in to manage association schedules.
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

    return (
        <View style={[styles.container, { flex: 1 }]}>
            <Stack.Screen options={{ title: "Association Schedule" }} />

            <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 32 }}
            >
                <View style={styles.headerRow}>
                    <View style={{ flex: 1 }}>
                        <AppText style={[styles.title, {
                            textAlign: "left",
                            marginBottom: 4,
                        }]}>
                            Association Schedule
                        </AppText>
                        <AppText style={styles.mutedText}>
                            Manage working days and shifts for this association.
                        </AppText>
                    </View>
                </View>

                {error ? (
                    <View style={[
                        styles.card,
                        { borderWidth: 1, borderColor: colors.danger },
                    ]}>
                        <AppText style={styles.errorText}>{error}</AppText>
                        <Pressable
                            onPress={() => void loadSchedules(true)}
                            style={[styles.smallButton, { alignSelf: "flex-start" }]}
                        >
                            <AppText style={styles.smallButtonText}>Try again</AppText>
                        </Pressable>
                    </View>
                ) : null}

                {confirmedSchedule ? (
                    <View style={styles.card}>
                        <AppText style={styles.subtitle}>
                            Current confirmed schedule
                        </AppText>
                        {renderSlots(confirmedSchedule.slots)}
                        <AppText style={styles.metaText}>
                            Effective from: {formatDateOnly(confirmedSchedule.effective_from)}
                        </AppText>
                    </View>
                ) : (
                    <View style={styles.card}>
                        <AppText style={styles.subtitle}>
                            No confirmed schedule
                        </AppText>
                        <AppText style={styles.description}>
                            Submit a schedule proposal to agree on working days and hours.
                        </AppText>
                    </View>
                )}

                {pendingProposal ? (
                    <View style={styles.card}>
                        <AppText style={styles.subtitle}>
                            A proposal is awaiting review
                        </AppText>
                        <AppText style={styles.description}>
                            Review or wait for the current proposal before submitting another.
                        </AppText>
                    </View>
                ) : (
                    <View style={styles.card}>
                        <AppText style={styles.subtitle}>
                            New schedule proposal
                        </AppText>

                        <AppText style={styles.label}>Effective from</AppText>
                        {Platform.OS === "web" ? (
                            <TextInput
                                {...({ type: "date" } as any)}
                                value={effectiveFrom}
                                onChangeText={(value) => {
                                    setEffectiveFrom(value);
                                    if (effectiveUntil && value && effectiveUntil < value) {
                                        setEffectiveUntil("");
                                    }
                                }}
                                style={styles.textInput}
                                accessibilityLabel="Effective start date"
                            />
                        ) : (
                            <>
                                <Pressable
                                    onPress={() => setShowEffectiveFromPicker(true)}
                                    style={styles.textInput}
                                    accessibilityRole="button"
                                    accessibilityLabel="Choose effective start date"
                                >
                                    <AppText style={effectiveFrom ? styles.text : styles.mutedText}>
                                        {effectiveFrom ? formatDateOnly(effectiveFrom) : "Select start date"}
                                    </AppText>
                                </Pressable>
                                {showEffectiveFromPicker ? (
                                    <DateTimePicker
                                        value={effectiveFrom ? parseDateOnly(effectiveFrom) : new Date()}
                                        mode="date"
                                        display="default"
                                        onChange={handleEffectiveFromChange}
                                    />
                                ) : null}
                            </>
                        )}

                        <AppText style={styles.label}>
                            Effective until (optional)
                        </AppText>
                        {Platform.OS === "web" ? (
                            <TextInput
                                {...({ type: "date", min: effectiveFrom || undefined } as any)}
                                value={effectiveUntil}
                                onChangeText={setEffectiveUntil}
                                style={styles.textInput}
                                accessibilityLabel="Effective end date"
                            />
                        ) : (
                            <>
                                <Pressable
                                    onPress={() => setShowEffectiveUntilPicker(true)}
                                    style={styles.textInput}
                                    accessibilityRole="button"
                                    accessibilityLabel="Choose effective end date"
                                >
                                    <AppText style={effectiveUntil ? styles.text : styles.mutedText}>
                                        {effectiveUntil ? formatDateOnly(effectiveUntil) : "No end date (ongoing schedule)"}
                                    </AppText>
                                </Pressable>
                                {showEffectiveUntilPicker ? (
                                    <DateTimePicker
                                        value={effectiveUntil
                                            ? parseDateOnly(effectiveUntil)
                                            : effectiveFrom
                                                ? parseDateOnly(effectiveFrom)
                                                : new Date()}
                                        mode="date"
                                        display="default"
                                        minimumDate={effectiveFrom ? parseDateOnly(effectiveFrom) : undefined}
                                        onChange={handleEffectiveUntilChange}
                                    />
                                ) : null}
                            </>
                        )}
                        <AppText style={styles.metaText}>
                            Dates are displayed using your device's regional settings.
                        </AppText>

                        <AppText style={styles.label}>Working days and shifts</AppText>

                        {DAYS.map((day) => {
                            const daySlots = slots.filter(
                                (slot) => slot.day_of_week === day,
                            );

                            return (
                                <View key={day} style={styles.replyBox}>
                                    <View style={[
                                        styles.cardHeader,
                                        { alignItems: "center" },
                                    ]}>
                                        <AppText style={styles.cardTitle}>{day}</AppText>
                                        <Pressable
                                            onPress={() => addSlot(day)}
                                            style={styles.smallButton}
                                        >
                                            <AppText style={styles.smallButtonText}>
                                                + Add shift
                                            </AppText>
                                        </Pressable>
                                    </View>

                                    {daySlots.length === 0 ? (
                                        <AppText style={styles.mutedText}>
                                            Not a working day
                                        </AppText>
                                    ) : null}

                                    {daySlots.map((slot, index) => (
                                        <View
                                            key={slot.localId}
                                            style={{
                                                marginTop: 8,
                                                paddingTop: 8,
                                                borderTopWidth: index === 0 ? 0 : 1,
                                                borderTopColor: colors.border,
                                            }}
                                        >
                                            <AppText style={styles.metaText}>
                                                Shift {index + 1}
                                            </AppText>

                                            <View style={{
                                                flexDirection: "row",
                                                gap: 8,
                                                alignItems: "center",
                                            }}>
                                                <View style={{ flex: 1 }}>
                                                    <AppText style={styles.metaText}>
                                                        Start (HH:mm)
                                                    </AppText>
                                                    <TextInput
                                                        value={slot.start_time}
                                                        onChangeText={(value) =>
                                                            updateSlot(
                                                                slot.localId,
                                                                "start_time",
                                                                value,
                                                            )
                                                        }
                                                        placeholder="09:00"
                                                        placeholderTextColor={colors.textMuted}
                                                        style={styles.textInput}
                                                        maxLength={5}
                                                        autoCapitalize="none"
                                                    />
                                                </View>

                                                <View style={{ flex: 1 }}>
                                                    <AppText style={styles.metaText}>
                                                        End (HH:mm)
                                                    </AppText>
                                                    <TextInput
                                                        value={slot.end_time}
                                                        onChangeText={(value) =>
                                                            updateSlot(
                                                                slot.localId,
                                                                "end_time",
                                                                value,
                                                            )
                                                        }
                                                        placeholder="17:00"
                                                        placeholderTextColor={colors.textMuted}
                                                        style={styles.textInput}
                                                        maxLength={5}
                                                        autoCapitalize="none"
                                                    />
                                                </View>

                                                <Pressable
                                                    onPress={() => removeSlot(slot.localId)}
                                                    accessibilityRole="button"
                                                    accessibilityLabel={`Remove ${day} shift ${index + 1}`}
                                                    style={[
                                                        styles.smallButton,
                                                        { backgroundColor: colors.danger },
                                                    ]}
                                                >
                                                    <AppText style={styles.smallButtonText}>
                                                        Remove
                                                    </AppText>
                                                </Pressable>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            );
                        })}

                        <AppText style={styles.label}>Notes (optional)</AppText>
                        <TextInput
                            value={notes}
                            onChangeText={setNotes}
                            placeholder="Add any schedule details or conditions..."
                            placeholderTextColor={colors.textMuted}
                            style={[
                                styles.textInput,
                                { minHeight: 80, textAlignVertical: "top" },
                            ]}
                            multiline
                            numberOfLines={3}
                        />

                        <Pressable
                            disabled={submitting || slots.length === 0}
                            onPress={() => void submitProposal()}
                            style={[
                                styles.button,
                                {
                                    opacity:
                                        submitting || slots.length === 0 ? 0.5 : 1,
                                },
                            ]}
                        >
                            {submitting ? (
                                <ActivityIndicator color={colors.badgeText} />
                            ) : (
                                <AppText style={styles.buttonText}>
                                    Submit schedule proposal
                                </AppText>
                            )}
                        </Pressable>
                    </View>
                )}

                <AppText style={styles.subtitle}>Schedule history</AppText>

                {schedules.length === 0 ? (
                    <View style={styles.card}>
                        <AppText style={styles.mutedText}>
                            No schedule proposals have been created yet.
                        </AppText>
                    </View>
                ) : (
                    schedules.map(renderSchedule)
                )}

                <Pressable
                    onPress={() => void loadSchedules(true)}
                    disabled={refreshing}
                    style={[styles.smallButton, {
                        alignSelf: "center",
                        marginTop: 8,
                    }]}
                >
                    {refreshing ? (
                        <ActivityIndicator color={colors.badgeText} />
                    ) : (
                        <AppText style={styles.smallButtonText}>
                            Refresh schedules
                        </AppText>
                    )}
                </Pressable>
            </ScrollView>

            <Modal
                visible={dialog !== null}
                transparent
                animationType="fade"
                onRequestClose={() => setDialog(null)}
            >
                <View
                    style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                        padding: 20,
                        backgroundColor: "rgba(0,0,0,0.45)",
                    }}
                >
                    <View
                        style={{
                            width: "100%",
                            maxWidth: 440,
                            padding: 22,
                            borderRadius: 14,
                            backgroundColor: colors.card,
                            borderWidth: 1,
                            borderColor: colors.border,
                        }}
                    >
                        <AppText style={styles.subtitle}>
                            {dialog?.title ?? ""}
                        </AppText>
                        <AppText style={[styles.text, { marginTop: 10 }]}>
                            {dialog?.message ?? ""}
                        </AppText>

                        <View
                            style={{
                                flexDirection: "row",
                                justifyContent: "flex-end",
                                flexWrap: "wrap",
                                gap: 10,
                                marginTop: 22,
                            }}
                        >
                            <Pressable
                                onPress={() => setDialog(null)}
                                style={styles.smallButton}
                            >
                                <AppText style={styles.smallButtonText}>
                                    {dialog?.onConfirm ? "Cancel" : "Close"}
                                </AppText>
                            </Pressable>

                            {dialog?.onConfirm ? (
                                <Pressable
                                    onPress={() => {
                                        const action = dialog.onConfirm;
                                        void action?.();
                                    }}
                                    style={[
                                        styles.smallButton,
                                        {
                                            backgroundColor: dialog.destructive
                                                ? colors.danger
                                                : colors.success,
                                        },
                                    ]}
                                >
                                    <AppText style={styles.smallButtonText}>
                                        {dialog.confirmLabel ?? "Confirm"}
                                    </AppText>
                                </Pressable>
                            ) : null}
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
