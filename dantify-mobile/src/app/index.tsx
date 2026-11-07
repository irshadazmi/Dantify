import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { AppText } from '@/components/ui/app-text';
import AppHeader from '@/components/ui/app-header';
import TabBar from '@/components/tab-bar';
import { IconSymbol } from '@/components/icon-symbol';
import PublicSearchBar from '@/components/booking/public-search-bar';
import PublicBookingHeader from '@/components/booking/public-booking-header';
import { useAuth } from '@/contexts/auth-context';
import { useAppColors } from '@/hooks/use-app-colors';
import { usePublicLandingStyles } from '@/styles/styles';
import dentistSearchService, {
  type PublicSearchDentist,
} from '@/services/dentist-search-service';

const DEFAULT_LOCATION = 'Pune, Maharashtra';

const POPULAR_SPECIALIZATIONS = [
  // Search by stable word stems to match common stored variants.
  { label: 'General', query: '', icon: 'tooth' },
  { label: 'Orthodontist', query: 'Orthodont', icon: 'health-and-safety' },
  { label: 'Pediatric', query: 'Pediatric', icon: 'person.2.fill' },
  { label: 'Endodontist', query: 'Endodont', icon: 'healing' },
] as const;

function getDentistLocation(dentist: PublicSearchDentist): string {
  const clinic = dentist.clinics?.[0];
  if (!clinic) return 'Clinic location not listed';

  return (
    [clinic.city, clinic.state].filter(Boolean).join(', ') ||
    clinic.address ||
    'Clinic location not listed'
  );
}

export default function PublicLandingScreen() {
  const router = useRouter();
  const colors = useAppColors();
  const styles = usePublicLandingStyles();
  const { isAuthenticated } = useAuth();

  const [query, setQuery] = useState('');
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [dentists, setDentists] = useState<PublicSearchDentist[]>([]);
  const [loadingDentists, setLoadingDentists] = useState(true);
  const [dentistLoadFailed, setDentistLoadFailed] = useState(false);

  const loadRecommendedDentists = useCallback(async () => {
    setLoadingDentists(true);
    setDentistLoadFailed(false);

    try {
      const response = await dentistSearchService.search({
        location,
        page: 1,
        per_page: 2,
      });
      setDentists(response.data?.data ?? []);
    } catch (error) {
      console.warn('[PublicLanding] Could not load recommended dentists.', error);
      setDentists([]);
      setDentistLoadFailed(true);
    } finally {
      setLoadingDentists(false);
    }
  }, [location]);

  useEffect(() => {
    void loadRecommendedDentists();
  }, [loadRecommendedDentists]);

  const openSearch = useCallback((searchText = query) => {
    Keyboard.dismiss();
    router.push({
      pathname: '/booking/results',
      params: {
        query: searchText.trim(),
        location,
      },
    } as never);
  }, [location, query, router]);

  const openDentist = useCallback((dentist: PublicSearchDentist) => {
    router.push({
      pathname: '/booking/dentist/[id]',
      params: { id: String(dentist.id), type: 'dentists', name: dentist.name, location },
    } as never);
  }, [location, router]);

  const openAppointments = useCallback(() => {
    if (isAuthenticated) {
      router.push('/appointments' as never);
    } else {
      router.push('/(auth)/login' as never);
    }
  }, [isAuthenticated, router]);

  const openLogin = useCallback(() => {
    if (isAuthenticated) {
      router.push('/dashboard' as never);
    } else {
      router.push('/(auth)/login' as never);
    }
  }, [isAuthenticated, router]);

  const openRegister = useCallback(() => {
    if (isAuthenticated) {
      router.push('/dashboard' as never);
    } else {
      router.push('/(auth)/register' as never);
    }
  }, [isAuthenticated, router]);

  const openVoiceSearch = useCallback(() => {
    // The microphone UI is included now. Speech-to-text will be connected
    // after confirming the project's Expo SDK and native speech package.
    Alert.alert(
      'Voice search',
      'Voice-to-text will be enabled in the voice-search phase. You can use the search box in the meantime.',
    );
  }, []);


  return (
    <View style={styles.screen}>
      {isAuthenticated ? <AppHeader title="DANTIFY" /> : null}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <PublicBookingHeader location={location} onLocationChange={setLocation} />

        <View style={styles.heroRow}>
          <View style={styles.heroCopy}>
            <AppText style={styles.heroTitle}>Find the right dentist for you</AppText>
            <AppText style={styles.heroSubtitle}>
              Search dentists or specializations near you.
            </AppText>
          </View>
          <Image
            source={require('../../assets/images/dantify-landing-hero.png')}
            resizeMode="contain"
            accessibilityLabel="Dantify dental appointment and care illustration"
            style={styles.heroArtwork}
          />
        </View>

        <View style={styles.searchCard}>
          <PublicSearchBar
            value={query}
            onChangeText={setQuery}
            onSearch={() => openSearch()}
            onVoiceSearch={openVoiceSearch}
            placeholder="Dentist, specialization or clinic"
            accessibilityLabel="Search dentists, clinics or dental concerns"
          />
          <AppText style={styles.searchHint}>
            Search by dentist, specialization or location
          </AppText>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeadingRow}>
            <AppText style={styles.sectionTitle}>Popular Specializations</AppText>
            <Pressable onPress={() => openSearch('')} accessibilityRole="link" hitSlop={6}>
              <AppText style={styles.viewAll}>View all</AppText>
            </Pressable>
          </View>

          <View style={styles.specializationsRow}>
            {POPULAR_SPECIALIZATIONS.map((item) => (
              <Pressable
                key={item.label}
                onPress={() => openSearch(item.query)}
                style={({ pressed }) => [styles.specializationCard, pressed && styles.pressedCard]}
                accessibilityRole="button"
                accessibilityLabel={`Search ${item.label} dentists`}
              >
                <IconSymbol name={item.icon as never} size={27} color={colors.primary} />
                <AppText style={styles.specializationLabel} numberOfLines={1}>
                  {item.label}
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[styles.section, styles.recommendedSection]}>
          <View style={styles.sectionHeadingRow}>
            <View style={styles.nearbyHeading}>
              <AppText style={styles.sectionTitle}>Top Dentists Near You</AppText>
              <AppText style={styles.sectionSubtitle}>
                Based on clinics in {location.split(',')[0]}
              </AppText>
            </View>
            <Pressable onPress={() => openSearch('')} accessibilityRole="link" hitSlop={6}>
              <AppText style={styles.viewAll}>View all →</AppText>
            </Pressable>
          </View>

          {loadingDentists ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.primary} />
              <AppText style={styles.mutedText}>
                Finding dentists near {location.split(',')[0]}...
              </AppText>
            </View>
          ) : dentists.length > 0 ? (
            dentists.map((dentist) => (
              <Pressable
                key={dentist.id}
                onPress={() => openDentist(dentist)}
                style={({ pressed }) => [styles.dentistCard, pressed && styles.pressedCard]}
                accessibilityRole="button"
                accessibilityLabel={`View profile of ${dentist.name}`}
              >
                <View style={styles.dentistAvatar}>
                  {dentist.profile_photo_url ? (
                    <Image
                      source={{ uri: dentist.profile_photo_url }}
                      style={styles.dentistPhoto}
                      resizeMode="cover"
                    />
                  ) : (
                    <IconSymbol name="person.fill" size={27} color={colors.primary} />
                  )}
                </View>
                <View style={styles.dentistInfo}>
                  <AppText style={styles.dentistName} numberOfLines={1}>
                    {dentist.name}
                  </AppText>
                  <AppText style={styles.dentistSpecialty} numberOfLines={1}>
                    {dentist.specialization || 'Dental Practitioner'}
                  </AppText>
                  <View style={styles.dentistLocationRow}>
                    <IconSymbol name="location.fill" size={13} color={colors.textMuted} />
                    <AppText style={styles.dentistLocation} numberOfLines={1}>
                      {getDentistLocation(dentist)}
                    </AppText>
                  </View>
                </View>
                <View style={styles.profileAction}>
                  <AppText style={styles.profileActionText}>Profile</AppText>
                  <IconSymbol name="chevron.right" size={15} color={colors.primary} />
                </View>
              </Pressable>
            ))
          ) : (
            <View style={styles.emptyDentists}>
              <View style={styles.emptyIcon}>
                <IconSymbol name="medical-services" size={24} color={colors.primary} />
              </View>
              <View style={styles.emptyDentistsText}>
                <AppText style={styles.emptyTitle}>
                  {dentistLoadFailed
                    ? 'Dentist discovery is temporarily unavailable'
                    : 'No dentists found in this area yet'}
                </AppText>
                <AppText style={styles.mutedText}>
                  {dentistLoadFailed
                    ? 'You can still search for dentists by name or specialization.'
                    : 'Try changing your location or search for another area.'}
                </AppText>
              </View>
              <Pressable
                onPress={loadRecommendedDentists}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Retry loading dentists"
              >
                <IconSymbol name="arrow.clockwise" size={19} color={colors.primary} />
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>

      {isAuthenticated ? (
        <TabBar />
      ) : (
        <View style={styles.bottomBar}>
          <PublicTab icon="house.fill" label="Home" active onPress={() => router.replace('/' as never)} />
          <PublicTab icon="calendar" label="Appointments" onPress={openAppointments} />
          <PublicTab icon="login" label="Login" onPress={openLogin} />
          <PublicTab icon="person.badge.plus" label="Register" onPress={openRegister} />
        </View>
      )}

    </View>
  );
}

function PublicTab({
  icon,
  label,
  active = false,
  onPress,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  const colors = useAppColors();
  const styles = usePublicLandingStyles();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tabItem, pressed && styles.tabPressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <IconSymbol
        name={icon as never}
        size={21}
        color={active ? colors.tabActive : colors.tabInactive}
      />
      <AppText style={active ? styles.tabLabelActive : styles.tabLabel}>
        {label}
      </AppText>
    </Pressable>
  );
}
