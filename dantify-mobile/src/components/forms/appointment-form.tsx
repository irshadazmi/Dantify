// src/components/appointment/appointment-form.tsx

import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { AppInput } from '@/components/ui/app-input';
import { AppButton } from '@/components/ui/app-button';
import { useStyles } from '@/styles/styles';
import { useAppColors } from '@/hooks/use-app-colors';
import { ROLES, type RoleType } from '@/constants/CONSTANTS';

/* ======================================================
   TYPES & VALIDATION
====================================================== */

const AppointmentSchema = z.object({
    date: z.string()
        .min(1, 'Date is required')
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),

    startTime: z.string()
        .min(1, 'Start time is required')
        .regex(
            /^([01]\d|2[0-3]):[0-5]\d$/,
            'Use HH:mm (24-hour format)',
        ),

    durationMinutes: z.union([
        z.literal(15),
        z.literal(30),
        z.literal(45),
        z.literal(60),
    ]),

    notes: z.string().optional(),

    patient_id: z.number().optional(),
    clinic_id: z.number().optional(),
    dentist_id: z.number().optional(),
});

export type AppointmentFormValues = z.infer<
    typeof AppointmentSchema
>;

type SelectItem = {
    id: number;
    name: string;
};

type Props = {
    role: RoleType;
    clinics?: SelectItem[];
    dentists?: SelectItem[];
    patients?: SelectItem[];
    initialValues?: Partial<AppointmentFormValues>;
    onChange: (values: AppointmentFormValues) => void;
};

/* ======================================================
   CONSTANTS
====================================================== */

const DURATIONS = [
    { label: '15 min', value: 15 },
    { label: '30 min', value: 30 },
    { label: '45 min', value: 45 },
    { label: '60 min', value: 60 },
] as const;

const today = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

/* ======================================================
   COMPONENT
====================================================== */

export default function AppointmentForm({
    role,
    clinics = [],
    dentists = [],
    patients = [],
    initialValues,
    onChange,
}: Props) {
    const styles = useStyles();
    const COLORS = useAppColors();

    const isPatient = role === ROLES.PATIENT;
    const isClinicAdmin = role === ROLES.CLINIC;
    const isDentist = role === ROLES.DENTIST;
    const isStaff = role === ROLES.STAFF;

    const canBookForPatient =
        isClinicAdmin || isDentist || isStaff;

    const {
        control,
        watch,
        formState: { errors },
    } = useForm<AppointmentFormValues>({
        resolver: zodResolver(AppointmentSchema),
        defaultValues: {
            date: initialValues?.date ?? today(),
            startTime: initialValues?.startTime ?? '10:00',
            durationMinutes: initialValues?.durationMinutes ?? 30,
            notes: initialValues?.notes ?? '',
            patient_id: initialValues?.patient_id,
            clinic_id: initialValues?.clinic_id,
            dentist_id: initialValues?.dentist_id,
        },
        mode: 'onChange',
    });

    const values = watch();

    useEffect(() => {
        const result = AppointmentSchema.safeParse(values);

        // Emit only validated values to the parent.
        if (result.success) {
            onChange(result.data);
        }
    }, [
        values.date,
        values.startTime,
        values.durationMinutes,
        values.notes,
        values.patient_id,
        values.clinic_id,
        values.dentist_id,
        onChange,
    ]);

    return (
        <View>
            {/* DATE */}
            <Controller
                control={control}
                name="date"
                render={({ field: { value, onChange, onBlur } }) => (
                    <>
                        <AppInput
                            value={value}
                            onChangeText={onChange}
                            onBlur={onBlur}
                            placeholder="YYYY-MM-DD"
                            accessibilityLabel="Appointment date"
                        />
                        <Text style={styles.errorText}>
                            {errors.date?.message ?? ''}
                        </Text>
                    </>
                )}
            />

            {/* START TIME */}
            <Controller
                control={control}
                name="startTime"
                render={({ field: { value, onChange, onBlur } }) => (
                    <>
                        <AppInput
                            value={value}
                            onChangeText={onChange}
                            onBlur={onBlur}
                            placeholder="HH:mm"
                            accessibilityLabel="Appointment start time"
                        />
                        <Text style={styles.errorText}>
                            {errors.startTime?.message ?? ''}
                        </Text>
                    </>
                )}
            />

            {/* DURATION */}
            <Text style={styles.label}>Duration</Text>

            <View style={styles.chipsContainer}>
                {DURATIONS.map((duration) => {
                    const selected =
                        values.durationMinutes === duration.value;

                    return (
                        <Controller
                            key={duration.value}
                            control={control}
                            name="durationMinutes"
                            render={({ field: { onChange } }) => (
                                <AppButton
                                    title={duration.label}
                                    variant={selected ? 'primary' : 'small'}
                                    onPress={() => onChange(duration.value)}
                                />
                            )}
                        />
                    );
                })}
            </View>

            {/* PATIENT BOOKING */}
            {isPatient && (
                <>
                    <Text style={styles.label}>Clinic</Text>
                    <Controller
                        control={control}
                        name="clinic_id"
                        render={({ field: { value, onChange } }) => (
                            <View>
                                {clinics.map((clinic) => (
                                    <AppButton
                                        key={clinic.id}
                                        title={clinic.name}
                                        variant={
                                            value === clinic.id ? 'primary' : 'small'
                                        }
                                        onPress={() => onChange(clinic.id)}
                                    />
                                ))}
                            </View>
                        )}
                    />

                    <Text style={styles.label}>Dentist (optional)</Text>
                    <Controller
                        control={control}
                        name="dentist_id"
                        render={({ field: { value, onChange } }) => (
                            <View>
                                {dentists.map((dentist) => (
                                    <AppButton
                                        key={dentist.id}
                                        title={dentist.name}
                                        variant={
                                            value === dentist.id ? 'primary' : 'small'
                                        }
                                        onPress={() => onChange(dentist.id)}
                                    />
                                ))}
                            </View>
                        )}
                    />
                </>
            )}

            {/* CLINIC / DENTIST BOOKING */}
            {canBookForPatient && (
                <>
                    <Text style={styles.label}>Patient</Text>
                    <Controller
                        control={control}
                        name="patient_id"
                        render={({ field: { value, onChange } }) => (
                            <View>
                                {patients.map((patient) => (
                                    <AppButton
                                        key={patient.id}
                                        title={patient.name}
                                        variant={
                                            value === patient.id ? 'primary' : 'small'
                                        }
                                        onPress={() => onChange(patient.id)}
                                    />
                                ))}
                            </View>
                        )}
                    />
                </>
            )}

            {/* NOTES */}
            <Text style={styles.label}>Notes</Text>

            <Controller
                control={control}
                name="notes"
                render={({ field: { value, onChange, onBlur } }) => (
                    <AppInput
                        value={value ?? ''}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        placeholder="Optional notes"
                        accessibilityLabel="Appointment notes"
                    />
                )}
            />
        </View>
    );
}