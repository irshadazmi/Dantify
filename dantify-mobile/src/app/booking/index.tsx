
import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { AppInput } from '@/components/ui/app-input';
import { AppText } from '@/components/ui/app-text';
import { useAppColors } from '@/hooks/use-app-colors';
import { useStyles } from '@/styles/styles';

const SUGGESTED_PROMPTS = [
  {
    icon: '✦',
    text: 'Find a dentist for tooth pain near me',
  },
  {
    icon: '♡',
    text: 'Show orthodontists near me',
  },
  {
    icon: '⌕',
    text: 'Find Dr. Sharma in Baner',
  },
];

const LANGUAGES = ['English', 'हिंदी', 'मराठी'] as const;

type Language = (typeof LANGUAGES)[number];

export default function FindDentistScreen() {
  const router = useRouter();
  const styles = useStyles();
  const colors = useAppColors();

  const [query, setQuery] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [language, setLanguage] =
    React.useState<Language>('English');

  const searchDentists = (searchText = query) => {
    const trimmedQuery = searchText.trim();

    if (!trimmedQuery) {
      Alert.alert(
        'Find a Dentist',
        'Please describe your dental concern or enter a dentist, clinic, or location.',
      );
      return;
    }

    router.push({
      pathname: '/booking/results',
      params: {
        query: trimmedQuery,
        location,
        language,
      },
    });
  };

  const chooseLocation = () => {
    Alert.alert(
      'Choose Location',
      'Location search will be connected to the location picker in a subsequent step.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Enter manually',
          onPress: () => {
            Alert.prompt?.(
              'Your location',
              'Enter a city or locality',
              (value) => setLocation(value?.trim() ?? ''),
            );
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        padding: 16,
        paddingBottom: 36,
        flexGrow: 1,
      }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <AppText style={styles.title}>Find a Dentist</AppText>

        <Pressable
          onPress={chooseLocation}
          accessibilityRole="button"
          accessibilityLabel="Choose your location"
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 12,
            backgroundColor: colors.surface,
          }}
        >
          <AppText style={{ color: colors.primary }}>
            {location || '⌖ Location'}
          </AppText>
        </Pressable>
      </View>

      {/* Introduction */}
      <View style={{ marginBottom: 24 }}>
        <AppText
          style={[
            styles.title,
            { textAlign: 'center', marginBottom: 8 },
          ]}
        >
          How can we help you today?
        </AppText>

        <AppText
          style={{
            color: colors.textMuted,
            textAlign: 'center',
            lineHeight: 22,
          }}
        >
          Describe your dental concern or find a dentist by name.
        </AppText>
      </View>

      {/* Search input and voice action */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 16,
          padding: 8,
          backgroundColor: colors.surface,
        }}
      >
        <View style={{ flex: 1 }}>
          <AppInput
            value={query}
            onChangeText={setQuery}
            placeholder="Describe your dental concern or preferred dentist"
            multiline
            autoCapitalize="sentences"
            returnKeyType="search"
            onSubmitEditing={() => searchDentists()}
            accessibilityLabel="Describe your dental concern or preferred dentist"
          />
        </View>

        <Pressable
          onPress={() =>
            Alert.alert(
              'Voice Search',
              'Voice input will be enabled when speech recognition is integrated.',
            )
          }
          accessibilityRole="button"
          accessibilityLabel="Start voice search"
          style={{
            padding: 12,
            borderRadius: 24,
            backgroundColor: colors.background,
          }}
        >
          <AppText style={{ color: colors.primary, fontSize: 20 }}>
            🎙
          </AppText>
        </Pressable>
      </View>

      {/* Search action */}
      <Pressable
        onPress={() => searchDentists()}
        accessibilityRole="button"
        style={[
          styles.button,
          {
            marginTop: 14,
            marginBottom: 28,
            alignItems: 'center',
          },
        ]}
      >
        <AppText style={styles.buttonText}>Search Dentists</AppText>
      </Pressable>

      {/* Suggestions */}
      <AppText style={{ fontWeight: '600', marginBottom: 12 }}>
        Try saying
      </AppText>

      {SUGGESTED_PROMPTS.map((item) => (
        <Pressable
          key={item.text}
          onPress={() => {
            setQuery(item.text);
            searchDentists(item.text);
          }}
          accessibilityRole="button"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            padding: 14,
            marginBottom: 10,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 14,
            backgroundColor: colors.surface,
          }}
        >
          <AppText
            style={{ fontSize: 20, color: colors.primary }}
          >
            {item.icon}
          </AppText>

          <View style={{ flex: 1 }}>
            <AppText>{item.text}</AppText>
          </View>
        </Pressable>
      ))}

      <View style={{ flex: 1, minHeight: 24 }} />

      {/* Language selector */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginTop: 24,
          marginBottom: 12,
        }}
      >
        {LANGUAGES.map((item, index) => (
          <React.Fragment key={item}>
            {index > 0 && (
              <AppText
                style={{
                  color: colors.border,
                  marginHorizontal: 12,
                }}
              >
                |
              </AppText>
            )}

            <Pressable
              onPress={() => setLanguage(item)}
              accessibilityRole="button"
              accessibilityState={{
                selected: language === item,
              }}
              style={{ paddingVertical: 8 }}
            >
              <AppText
                style={{
                  color:
                    language === item
                      ? colors.primary
                      : colors.textMuted,
                  fontWeight:
                    language === item ? '700' : '400',
                }}
              >
                {item}
              </AppText>
            </Pressable>
          </React.Fragment>
        ))}
      </View>

      <AppText
        style={{
          color: colors.textMuted,
          fontSize: 12,
          textAlign: 'center',
        }}
      >
        Browse freely. Sign in when you're ready to book.
      </AppText>
    </ScrollView>
  );
}
