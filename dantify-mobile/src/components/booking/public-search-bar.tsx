import React from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { IconSymbol } from '@/components/icon-symbol';
import { useAppColors } from '@/hooks/use-app-colors';

type PublicSearchBarProps = {
  value: string;
  onChangeText: (value: string) => void;
  onSearch: () => void;
  onVoiceSearch: () => void;
  placeholder?: string;
  accessibilityLabel?: string;
  helperText?: string;
  voiceDisabled?: boolean;
};

export default function PublicSearchBar({
  value,
  onChangeText,
  onSearch,
  onVoiceSearch,
  placeholder = 'Dentist, treatment or dental concern',
  accessibilityLabel = 'Search dentists, clinics or dental services',
  helperText,
  voiceDisabled = false,
}: PublicSearchBarProps) {
  const colors = useAppColors();

  return (
    <View style={{ gap: 7 }}>
      <View
        style={{
          minHeight: 56,
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: colors.primary,
          borderRadius: 16,
          backgroundColor: colors.surface,
          paddingLeft: 12,
          paddingRight: 5,
          gap: 3,
        }}
      >
        <IconSymbol name="magnifyingglass" size={19} color={colors.textMuted} />

        <TextInput
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSearch}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
          autoCorrect
          autoCapitalize="sentences"
          multiline={false}
          style={{
            flex: 1,
            minWidth: 0,
            color: colors.text,
            fontSize: 14,
            paddingHorizontal: 7,
            paddingVertical: 11,
          }}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint="Enter a dentist name, specialization or search phrase, then tap Search"
        />

        {value.length > 0 ? (
          <Pressable
            onPress={() => onChangeText('')}
            hitSlop={7}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            style={{
              width: 32,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 10,
            }}
          >
            <IconSymbol name="xmark.circle.fill" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}

        <Pressable
          onPress={onVoiceSearch}
          disabled={voiceDisabled}
          hitSlop={5}
          accessibilityRole="button"
          accessibilityLabel="Start voice search"
          accessibilityState={{ disabled: voiceDisabled }}
          style={{
            width: 38,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 10,
            opacity: voiceDisabled ? 0.45 : 1,
          }}
        >
          <IconSymbol name="mic.fill" size={19} color={colors.primary} />
        </Pressable>

        <Pressable
          onPress={onSearch}
          accessibilityRole="button"
          accessibilityLabel="Search"
          style={({ pressed }) => ({
            minWidth: 66,
            height: 42,
            paddingHorizontal: 13,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 11,
            backgroundColor: colors.primary,
            opacity: pressed ? 0.82 : 1,
          })}
        >
          <AppText style={{ color: colors.badgeText, fontSize: 13, fontWeight: '700' }}>
            Search
          </AppText>
        </Pressable>
      </View>

      {helperText ? (
        <AppText style={{ color: colors.textMuted, fontSize: 11, lineHeight: 16 }}>
          {helperText}
        </AppText>
      ) : null}
    </View>
  );
}
