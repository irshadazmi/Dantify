import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { AppText } from '@/components/ui/app-text';
import { IconSymbol } from '@/components/icon-symbol';
import { useAuth } from '@/contexts/auth-context';
import { useAppColors } from '@/hooks/use-app-colors';
import { usePublicLandingStyles } from '@/styles/styles';
import dentistSearchService, {
  type PublicSearchDentist,
} from '@/services/dentist-search-service';

const POPULAR_TREATMENTS = [
  { label: 'Cleaning', icon: 'cleaning-services', query: 'Dental Cleaning' },
  { label: 'Whitening', icon: 'auto-awesome', query: 'Teeth Whitening' },
  { label: 'Braces', icon: 'medical-services', query: 'Braces Orthodontist' },
  { label: 'Root canal', icon: 'healing', query: 'Root Canal' },
];

const DEFAULT_LOCATION = 'Pune, Maharashtra';

function getDentistLocation(dentist: PublicSearchDentist): string {
  const clinic = dentist.clinics?.[0];
  if (!clinic) return 'Location not listed';
  return [clinic.city, clinic.state].filter(Boolean).join(', ') ||
    clinic.address || 'Location not listed';
}

export default function PublicLandingScreen() {
  const router = useRouter();
  const colors = useAppColors();
  const styles = usePublicLandingStyles();
  const { isAuthenticated } = useAuth();

  const [query, setQuery] = useState('');
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [locationDraft, setLocationDraft] = useState(DEFAULT_LOCATION);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
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

  const openSearch = useCallback((searchText = query, resultType: 'dentists' | 'clinics' = 'dentists') => {
    Keyboard.dismiss();
    router.push({
      pathname: '/booking/results',
      params: {
        query: searchText.trim(),
        location,
        language: 'English',
        type: resultType,
      },
    });
  }, [location, query, router]);

  const openAppointments = () => {
    if (isAuthenticated) {
      router.push('/appointments' as never);
    } else {
      router.push({
        pathname: '/(auth)/login' as never,
        params: { redirectTo: '/appointments' },
      } as never);
    }
  };

  const openAccount = () => {
    if (isAuthenticated) {
      router.push('/dashboard' as never);
    } else {
      router.push('/(auth)/login' as never);
    }
  };

  const openDentist = (dentist: PublicSearchDentist) => {
    router.push({
      pathname: '/booking/dentist/[id]',
      params: {
        id: String(dentist.id),
        type: 'dentists',
        name: dentist.name,
      },
    });
  };

  const saveLocation = () => {
    const nextLocation = locationDraft.trim();
    if (nextLocation) setLocation(nextLocation);
    setLocationModalVisible(false);
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        <View style={styles.heroRow}>
          <View style={styles.heroCopy}>
            <AppText style={styles.heroTitle}>Your smile, cared for.</AppText>
            <AppText style={styles.heroSubtitle}>
              Find trusted dental care near you.
            </AppText>
          </View>
          <Image
            source={require('../../assets/images/dantify-landing-hero.png')}
            resizeMode="contain"
            accessibilityLabel="Dental appointment calendar, care shield and tooth illustration"
            style={styles.heroArtwork}
          />
        </View>

        <View style={styles.searchCard}>
          <AppText style={styles.searchLabel}>Find your dentist</AppText>
          <View style={styles.searchInputRow}>
            <IconSymbol name="magnifyingglass" size={20} color={colors.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => openSearch()}
              placeholder="Dentist, treatment or clinic"
              placeholderTextColor={colors.textMuted}
              returnKeyType="search"
              autoCorrect={false}
              style={styles.searchInput}
              accessibilityLabel="Search dentist, treatment or clinic"
            />
            <Pressable
              onPress={() => router.push('/booking' as never)}
              hitSlop={8}
              style={styles.voiceButton}
              accessibilityRole="button"
              accessibilityLabel="Open voice search"
            >
              <IconSymbol name="mic.fill" size={21} color={colors.primary} />
            </Pressable>
          </View>
          <View style={styles.searchDivider} />
          <Pressable
            onPress={() => {
              setLocationDraft(location);
              setLocationModalVisible(true);
            }}
            style={styles.locationRow}
            accessibilityRole="button"
            accessibilityLabel={`Change location, current location ${location}`}
          >
            <IconSymbol name="location.fill" size={18} color={colors.primary} />
            <AppText style={styles.locationText} numberOfLines={1}>{location}</AppText>
            <IconSymbol name="expand-more" size={18} color={colors.textMuted} />
          </Pressable>
          <Pressable
            onPress={() => openSearch()}
            style={styles.searchButton}
            accessibilityRole="button"
          >
            <AppText style={styles.searchButtonText}>Search dentists</AppText>
          </Pressable>
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Popular treatments</AppText>
          <View style={styles.treatmentsRow}>
            {POPULAR_TREATMENTS.map((item) => (
              <Pressable
                key={item.label}
                onPress={() => openSearch(item.query)}
                style={styles.treatmentItem}
                accessibilityRole="button"
              >
                <View style={styles.treatmentIcon}>
                  <IconSymbol name={item.icon as never} size={25} color={colors.primary} />
                </View>
                <AppText style={styles.treatmentLabel}>{item.label}</AppText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Explore care</AppText>
          <View style={styles.exploreList}>
            <Pressable
              onPress={() => openSearch('Dental clinics', 'clinics')}
              style={styles.exploreCard}
              accessibilityRole="button"
            >
              <View style={styles.exploreIconBox}>
                <IconSymbol name="location.fill" size={25} color={colors.primary} />
              </View>
              <View style={styles.exploreCopy}>
                <AppText style={styles.exploreTitle}>Clinics near you</AppText>
                <AppText style={styles.exploreSubtitle}>Browse nearby dental clinics</AppText>
              </View>
              <IconSymbol name="chevron.right" size={18} color={colors.textSecondary} />
            </Pressable>
            <Pressable
              onPress={() => openSearch('Specialist dentist')}
              style={styles.exploreCard}
              accessibilityRole="button"
            >
              <View style={styles.exploreIconBox}>
                <IconSymbol name="health-and-safety" size={25} color={colors.primary} />
              </View>
              <View style={styles.exploreCopy}>
                <AppText style={styles.exploreTitle}>Find a specialist</AppText>
                <AppText style={styles.exploreSubtitle}>Search by dental expertise</AppText>
              </View>
              <IconSymbol name="chevron.right" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        <View style={[styles.section, styles.recommendedSection]}>
          <View style={styles.sectionHeadingRow}>
            <AppText style={styles.sectionTitle}>Recommended dentists</AppText>
            <Pressable onPress={() => openSearch('')} accessibilityRole="link">
              <AppText style={styles.viewAll}>View all</AppText>
            </Pressable>
          </View>

          {loadingDentists ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.primary} />
              <AppText style={styles.mutedText}>Finding dentists near {location}...</AppText>
            </View>
          ) : dentists.length > 0 ? (
            dentists.map((dentist) => (
              <Pressable
                key={dentist.id}
                onPress={() => openDentist(dentist)}
                style={styles.dentistCard}
                accessibilityRole="button"
                accessibilityLabel={`View ${dentist.name}`}
              >
                <View style={styles.dentistAvatar}>
                  <IconSymbol name="person.fill" size={27} color={colors.primary} />
                </View>
                <View style={styles.dentistInfo}>
                  <AppText style={styles.dentistName}>{dentist.name}</AppText>
                  <AppText style={styles.dentistSpecialty}>
                    {dentist.specialization || 'Dental Practitioner'}
                  </AppText>
                  <AppText style={styles.dentistLocation}>{getDentistLocation(dentist)}</AppText>
                </View>
                <IconSymbol name="chevron.right" size={17} color={colors.textSecondary} />
              </Pressable>
            ))
          ) : (
            <View style={styles.emptyDentists}>
              <IconSymbol name="medical-services" size={24} color={colors.textMuted} />
              <View style={styles.emptyDentistsText}>
                <AppText style={styles.emptyTitle}>
                  {dentistLoadFailed ? 'Dentist discovery is temporarily unavailable' : 'Explore dentist profiles'}
                </AppText>
                <AppText style={styles.mutedText}>
                  {dentistLoadFailed
                    ? 'You can still search for dentists and clinics.'
                    : 'Browse available dentists and clinics in your area.'}
                </AppText>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <PublicTab icon="house.fill" label="Home" active onPress={() => router.replace('/' as never)} />
        <PublicTab icon="calendar" label="Appointments" onPress={openAppointments} />
        <PublicTab icon="person.crop.circle" label="Account" onPress={openAccount} />
      </View>

      <Modal
        visible={locationModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.locationModal}>
            <View style={styles.modalHeader}>
              <AppText style={styles.modalTitle}>Choose your location</AppText>
              <Pressable onPress={() => setLocationModalVisible(false)} hitSlop={10}>
                <IconSymbol name="xmark" size={21} color={colors.textSecondary} />
              </Pressable>
            </View>
            <AppText style={styles.mutedText}>Enter a city, area or PIN code.</AppText>
            <TextInput
              value={locationDraft}
              onChangeText={setLocationDraft}
              placeholder="e.g. Baner, Pune"
              placeholderTextColor={colors.textMuted}
              style={styles.locationInput}
              returnKeyType="done"
              onSubmitEditing={saveLocation}
              autoFocus
            />
            <Pressable onPress={saveLocation} style={styles.searchButton}>
              <AppText style={styles.searchButtonText}>Apply location</AppText>
            </Pressable>
          </View>
        </View>
      </Modal>
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
    <Pressable onPress={onPress} style={styles.tabItem} accessibilityRole="button">
      <IconSymbol
        name={icon as never}
        size={21}
        color={active ? colors.primary : colors.tabInactive}
      />
      <AppText style={active ? styles.tabLabelActive : styles.tabLabel}>
        {label}
      </AppText>
    </Pressable>
  );
}
