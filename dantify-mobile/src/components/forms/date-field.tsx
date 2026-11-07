
import React from 'react';
import {
    Platform,
    Pressable,
    View,
} from 'react-native';
import DateTimePicker, {
    DateTimePickerAndroid,
    type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

import { InlineField } from '@/components/ui/inline-field';
import { AppText } from '@/components/ui/app-text';
import { useAppColors } from '@/hooks/use-app-colors';

type Props = {
    label: string;
    value: string;
    onChange: (value: string) => void;
    maximumDate?: Date;
    minimumDate?: Date;
    error?: string;
    disabled?: boolean;
    placeholder?: string;
};

function parseDate(value: string): Date {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!match) return new Date();

    const [, year, month, day] = match;

    return new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        12,
    );
}

function formatDate(date: Date): string {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0'),
    ].join('-');
}

export default function DateField({
    label,
    value,
    onChange,
    maximumDate,
    minimumDate,
    error,
    disabled = false,
    placeholder = 'Select date',
}: Props) {
    const COLORS = useAppColors();
    const [visible, setVisible] = React.useState(false);

    const selectedDate = React.useMemo(
        () => parseDate(value),
        [value],
    );

    const handleNativeChange = (
        event: DateTimePickerEvent,
        date?: Date,
    ) => {
        if (event.type === 'dismissed') {
            setVisible(false);
            return;
        }

        if (date) {
            onChange(formatDate(date));
        }

        if (Platform.OS !== 'ios') {
            setVisible(false);
        }
    };

    const openPicker = () => {
        if (disabled) return;

        if (Platform.OS === 'android') {
            DateTimePickerAndroid.open({
                value: selectedDate,
                mode: 'date',
                display: 'default',
                maximumDate,
                minimumDate,
                onChange: handleNativeChange,
            });
            return;
        }

        setVisible(true);
    };

    return (
        <View>
            <InlineField label={label}>
                {Platform.OS === 'web' ? (
                    <View
                        style={{
                            borderWidth: 1,
                            borderColor: error ? COLORS.danger : COLORS.primary,
                            borderRadius: 8,
                            backgroundColor: COLORS.surface,
                            height: 46,
                            minHeight: 46,
                            maxHeight: 46,
                            marginTop: 12,
                            marginBottom: 18,
                            paddingHorizontal: 12,
                            justifyContent: 'center',
                            overflow: 'hidden',
                            opacity: disabled ? 0.6 : 1,
                        }}
                    >
                        {React.createElement('input', {
                            type: 'date',
                            value: value || '',
                            max: maximumDate
                                ? formatDate(maximumDate)
                                : undefined,
                            min: minimumDate
                                ? formatDate(minimumDate)
                                : undefined,
                            disabled,
                            'aria-label': label,
                            onChange: (
                                event: React.ChangeEvent<HTMLInputElement>,
                            ) => onChange(event.currentTarget.value),
                            style: {
                                height: '100%',
                                minHeight: 0,
                                maxHeight: '100%',
                                padding: 0,
                                border: 'none',
                                outline: 'none',
                                backgroundColor: 'transparent',
                                color: COLORS.text,
                                fontSize: 16,
                                fontFamily: 'inherit',
                                fontWeight: '400',
                                lineHeight: 'normal',
                                marginBottom: 0,
                                boxSizing: 'border-box',
                                appearance: 'none',
                            },
                        })}
                    </View>

                ) : (
                    <Pressable
                        onPress={openPicker}
                        disabled={disabled}
                        accessibilityRole="button"
                        accessibilityLabel={label}
                        style={{
                            borderWidth: 1,
                            borderColor: error ? COLORS.danger : COLORS.primary,
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 0,
                            height: 46,
                            marginTop: 12,
                            marginBottom: 18,
                            justifyContent: 'center',
                            backgroundColor: COLORS.surface,
                            opacity: disabled ? 0.6 : 1,
                        }}
                    >
                        <AppText style={{ fontSize: 16, fontWeight: '400' }}>
                            {value || placeholder}
                        </AppText>
                    </Pressable>
                )}
            </InlineField>

            {error ? (
                <AppText
                    variant="error"
                    style={{ marginTop: 2, marginBottom: 4 }}
                >
                    {error}
                </AppText>
            ) : null}

            {Platform.OS === 'ios' && visible ? (
                <View>
                    <DateTimePicker
                        value={selectedDate}
                        mode="date"
                        display="default"
                        maximumDate={maximumDate}
                        minimumDate={minimumDate}
                        onChange={handleNativeChange}
                    />


                    <Pressable
                        onPress={openPicker}
                        disabled={disabled}
                        accessibilityRole="button"
                        accessibilityLabel={label}
                        style={{
                            borderWidth: 1.5,
                            borderColor: error
                                ? COLORS.danger
                                : COLORS.primary,
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 14,
                            backgroundColor: COLORS.surface,
                            minHeight: 50,
                            justifyContent: 'center',
                            opacity: disabled ? 0.6 : 1,
                        }}
                    >
                        <AppText
                            style={{
                                fontSize: 18,
                                fontWeight: '400',
                            }}
                        >
                            {value || placeholder}
                        </AppText>
                    </Pressable>

                </View>
            ) : null}
        </View>
    );
}
