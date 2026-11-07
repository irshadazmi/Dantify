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
};

export default function PublicSearchBar({
  value,
  onChangeText,
  onSearch,
  onVoiceSearch,
  placeholder = 'Dentist, specialization or clinic',
  accessibilityLabel = 'Search dentists, clinics or specializations',
}: PublicSearchBarProps) {
  const colors = useAppColors();

  return (
    <View
      style={{
        minHeight: 54,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.primary,
        borderRadius: 15,
        backgroundColor: colors.surface,
        paddingLeft: 12,
        paddingRight: 5,
        gap: 5,
      }}
    >
      <IconSymbol
        name="magnifyingglass"
        size={19}
        color={colors.textMuted}
      />

      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSearch}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        returnKeyType="search"
        autoCorrect={false}
        style={{
          flex: 1,
          minWidth: 0,
          color: colors.text,
          fontSize: 14,
          paddingHorizontal: 7,
          paddingVertical: 10,
        }}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Enter a search term and tap Search or press Enter"
      />

      <Pressable
        onPress={onVoiceSearch}
        hitSlop={5}
        accessibilityRole="button"
        accessibilityLabel="Start voice search"
        style={{
          width: 38,
          height: 40,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 10,
        }}
      >
        <IconSymbol
          name="mic.fill"
          size={19}
          color={colors.primary}
        />
      </Pressable>

      <Pressable
        onPress={onSearch}
        accessibilityRole="button"
        accessibilityLabel="Search"
        style={({ pressed }) => ({
          minWidth: 66,
          height: 40,
          paddingHorizontal: 13,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 11,
          backgroundColor: colors.primary,
          opacity: pressed ? 0.82 : 1,
        })}
      >
        <AppText
          style={{
            color: colors.badgeText,
            fontSize: 13,
            fontWeight: '700',
          }}
        >
          Search
        </AppText>
      </Pressable>
    </View>
  );
}