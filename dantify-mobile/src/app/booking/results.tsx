import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppText } from '@/components/ui/app-text';
import AppHeader from '@/components/ui/app-header';
import TabBar from '@/components/tab-bar';
import PublicBookingTabBar from '@/components/booking/public-booking-tab-bar';
import PublicSearchBar from '@/components/booking/public-search-bar';
import PublicBookingHeader from '@/components/booking/public-booking-header';
import { IconSymbol } from '@/components/icon-symbol';
import { useAuth } from '@/contexts/auth-context';
import { useAppColors } from '@/hooks/use-app-colors';
import dentistSearchService, {
  type PublicSearchClinic,
  type PublicSearchDentist,
} from '@/services/dentist-search-service';

type ResultType = 'dentists' | 'clinics';

type ClinicResult = PublicSearchClinic & {
  dentists: PublicSearchDentist[];
};

function normalizeText(value: string): string {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function isLocationOnlyQuery(query: string, location: string): boolean {
  if (!query || !location) return false;

  const q = normalizeText(query);
  const fullLocation = normalizeText(location);
  const city = normalizeText(location.split(',')[0] ?? '');

  return q === fullLocation || (city.length > 0 && q === city);
}

function clinicAddress(clinic: PublicSearchClinic): string {
  return [
    clinic.address,
    clinic.city,
    clinic.state,
    clinic.postal_code,
  ].filter(Boolean).join(', ') || 'Address not available';
}

function dentistClinics(dentist: PublicSearchDentist): PublicSearchClinic[] {
  const seen = new Set<number>();
  return (dentist.clinics ?? []).filter((clinic) => {
    if (seen.has(clinic.id)) return false;
    seen.add(clinic.id);
    return true;
  });
}

function buildClinicResults(dentists: PublicSearchDentist[], query: string): ClinicResult[] {
  const clinicMap = new Map<number, ClinicResult>();
  const normalizedQuery = normalizeText(query);

  dentists.forEach((dentist) => {
    dentistClinics(dentist).forEach((clinic) => {
      const existing = clinicMap.get(clinic.id);
      if (existing) {
        if (!existing.dentists.some((item) => item.id === dentist.id)) {
          existing.dentists.push(dentist);
        }
      } else {
        clinicMap.set(clinic.id, { ...clinic, dentists: [dentist] });
      }
    });
  });

  const clinics = Array.from(clinicMap.values());

  if (!normalizedQuery) return clinics;

  return clinics.filter((clinic) => {
    const searchable = normalizeText([
      clinic.name,
      clinic.address,
      clinic.city,
      clinic.state,
      clinic.postal_code,
    ].filter(Boolean).join(' '));

    return searchable.includes(normalizedQuery);
  });
}

function DentistCard({
  dentist,
  onPress,
}: {
  dentist: PublicSearchDentist;
  onPress: () => void;
}) {
  const colors = useAppColors();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`View ${dentist.name} profile`}
      style={{
        padding: 14,
        marginBottom: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 66,
            height: 66,
            overflow: 'hidden',
            borderRadius: 15,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.backgroundElement,
          }}
        >
          {dentist.profile_photo_url ? (
            <Image
              source={{ uri: dentist.profile_photo_url }}
              resizeMode="cover"
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <IconSymbol name="person.fill" size={30} color={colors.primary} />
          )}
        </View>

        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <AppText
            style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}
            numberOfLines={1}
          >
            {dentist.name}
          </AppText>
          <AppText style={{ color: colors.textSecondary, fontSize: 13 }}>
            {dentist.specialization || 'Dental Practitioner'}
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <IconSymbol name="mappin.and.ellipse" size={13} color={colors.textMuted} />
            <AppText style={{ color: colors.textMuted, fontSize: 11 }} numberOfLines={1}>
              {dentist.clinics?.[0]
                ? [dentist.clinics[0].city, dentist.clinics[0].state].filter(Boolean).join(', ')
                : 'Clinic location not listed'}
            </AppText>
          </View>
        </View>

        <IconSymbol name="chevron.right" size={18} color={colors.primary} />
      </View>

      {dentistClinics(dentist).length > 0 && (
        <View
          style={{
            marginTop: 12,
            paddingTop: 10,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <AppText style={{ color: colors.textMuted, fontSize: 11, marginBottom: 5 }}>
            {dentistClinics(dentist).length === 1
              ? 'Associated clinic'
              : `${dentistClinics(dentist).length} associated clinics`}
          </AppText>
          {dentistClinics(dentist).slice(0, 2).map((clinic) => (
            <View key={clinic.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
              <IconSymbol name="building.2.fill" size={13} color={colors.primary} />
              <AppText style={{ color: colors.text, fontSize: 12, flex: 1 }} numberOfLines={1}>
                {clinic.name}
              </AppText>
            </View>
          ))}
        </View>
      )}

      <View style={{ alignItems: 'flex-end', marginTop: 11 }}>
        <View
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
          }}
        >
          <AppText style={{ color: colors.badgeText, fontSize: 12, fontWeight: '700' }}>
            View Profile
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}

function ClinicCard({
  clinic,
  onDentistPress,
}: {
  clinic: ClinicResult;
  onDentistPress: (dentist: PublicSearchDentist) => void;
}) {
  const colors = useAppColors();

  return (
    <View
      style={{
        padding: 14,
        marginBottom: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.backgroundElement,
          }}
        >
          <IconSymbol name="building.2.fill" size={22} color={colors.primary} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <AppText style={{ color: colors.text, fontSize: 15, fontWeight: '700' }}>
            {clinic.name}
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 5 }}>
            <IconSymbol name="mappin.and.ellipse" size={13} color={colors.textMuted} />
            <AppText style={{ flex: 1, color: colors.textSecondary, fontSize: 12, lineHeight: 17 }}>
              {clinicAddress(clinic)}
            </AppText>
          </View>
          {clinic.phone ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <IconSymbol name="phone.fill" size={12} color={colors.textMuted} />
              <AppText style={{ color: colors.textMuted, fontSize: 11 }}>{clinic.phone}</AppText>
            </View>
          ) : null}
        </View>
      </View>

      <View style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
        <AppText style={{ color: colors.textMuted, fontSize: 11, marginBottom: 7 }}>
          Dentists associated with this clinic
        </AppText>
        {clinic.dentists.map((dentist) => (
          <Pressable
            key={dentist.id}
            onPress={() => onDentistPress(dentist)}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 8 }}
          >
            <AppText style={{ flex: 1, color: colors.text, fontSize: 12, fontWeight: '600' }}>
              {dentist.name}
            </AppText>
            <AppText style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>
              View profile
            </AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function SearchResultsScreen() {
  const router = useRouter();
  const colors = useAppColors();
  const { isAuthenticated } = useAuth();

  const params = useLocalSearchParams<{
    query?: string;
    location?: string;
    type?: string;
  }>();

  const initialQuery = typeof params.query === 'string' ? params.query : '';
  const initialLocation = typeof params.location === 'string' ? params.location : '';

  const [searchLocation, setSearchLocation] = useState(initialLocation);
  const [searchText, setSearchText] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);
  const [resultType, setResultType] = useState<ResultType>(
    params.type === 'clinics' ? 'clinics' : 'dentists',
  );
  const [dentists, setDentists] = useState<PublicSearchDentist[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const effectiveQuery = isLocationOnlyQuery(submittedQuery.trim(), searchLocation) ? '' : submittedQuery.trim();

  const loadPage = useCallback(async (requestedPage: number, replace: boolean) => {
    if (replace) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await dentistSearchService.search({
        // Clinic search is derived from active clinic associations returned
        // by the current public dentist endpoint. It does not query clinic
        // names server-side; a dedicated clinic endpoint is a future backend task.
        query: resultType === 'dentists' ? effectiveQuery || undefined : undefined,
        location: searchLocation || undefined,
        page: requestedPage,
        per_page: 30,
      });

      const pagination = response.data;
      setDentists((current) => {
        if (replace) return pagination.data;
        const ids = new Set(current.map((item) => item.id));
        return [...current, ...pagination.data.filter((item) => !ids.has(item.id))];
      });
      setPage(pagination.current_page);
      setLastPage(pagination.last_page);
      setTotal(pagination.total);
    } catch (requestError) {
      console.warn('[BookingSearch] Search request failed.', requestError);
      if (replace) setDentists([]);
      setError('We could not load search results. Check your connection and try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [effectiveQuery, searchLocation, resultType]);

  useEffect(() => {
    void loadPage(1, true);
  }, [loadPage]);

  const clinics = useMemo(
    () => buildClinicResults(dentists, resultType === 'clinics' ? submittedQuery : ''),
    [dentists, resultType, submittedQuery],
  );

  const submitSearch = () => {
    Keyboard.dismiss();
    setSubmittedQuery(searchText.trim());
  };


  const openDentist = (dentist: PublicSearchDentist) => {
    router.push({
      pathname: '/booking/dentist/[id]',
      params: { id: String(dentist.id), location: searchLocation },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {isAuthenticated ? <AppHeader title="Search Results" /> : null}

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 28, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!isAuthenticated ? (
          <PublicBookingHeader
            location={searchLocation}
            onLocationChange={setSearchLocation}
          />
        ) : null}

        <PublicSearchBar
          value={searchText}
          onChangeText={setSearchText}
          onSearch={submitSearch}
          onVoiceSearch={() => {
            Keyboard.dismiss();
            Alert.alert(
              'Voice search',
              'Voice-to-text will be enabled in the voice-search phase. You can use the search box in the meantime.',
            );
          }}
          placeholder="Dentist, specialization or clinic"
          accessibilityLabel="Edit dentist or clinic search"
        />

        <View
          style={{
            flexDirection: 'row',
            padding: 4,
            borderRadius: 13,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 15,
          }}
        >
          {(['dentists', 'clinics'] as ResultType[]).map((type) => {
            const selected = resultType === type;
            return (
              <Pressable
                key={type}
                onPress={() => setResultType(type)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: selected ? colors.primary : 'transparent',
                }}
              >
                <AppText style={{ color: selected ? colors.badgeText : colors.text, fontWeight: '700', fontSize: 13 }}>
                  {type === 'dentists' ? 'Dentists' : 'Clinics'}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <AppText style={{ color: colors.textMuted, fontSize: 12 }}>
            {loading
              ? 'Searching...'
              : resultType === 'dentists'
                ? `${total} dentist${total === 1 ? '' : 's'} found`
                : `${clinics.length} clinic${clinics.length === 1 ? '' : 's'} in the returned results`}
          </AppText>
          <Pressable onPress={() => void loadPage(1, true)} disabled={loading} hitSlop={8}>
            <AppText style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>Refresh</AppText>
          </Pressable>
        </View>

        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 42 }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <AppText style={{ color: colors.textMuted, marginTop: 12 }}>
              Finding {resultType} near {searchLocation || 'you'}...
            </AppText>
          </View>
        ) : error ? (
          <View style={{ padding: 18, borderRadius: 15, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
            <AppText style={{ color: colors.danger, lineHeight: 20 }}>{error}</AppText>
            <Pressable onPress={() => void loadPage(1, true)} style={{ marginTop: 12 }}>
              <AppText style={{ color: colors.primary, fontWeight: '700' }}>Try again</AppText>
            </Pressable>
          </View>
        ) : resultType === 'dentists' ? (
          dentists.length > 0 ? (
            dentists.map((dentist) => (
              <DentistCard key={dentist.id} dentist={dentist} onPress={() => openDentist(dentist)} />
            ))
          ) : (
            <EmptyState title="No dentists found" message="Try another dentist name, specialization or location." />
          )
        ) : clinics.length > 0 ? (
          clinics.map((clinic) => (
            <ClinicCard key={clinic.id} clinic={clinic} onDentistPress={openDentist} />
          ))
        ) : (
          <EmptyState
            title="No matching clinics in these results"
            message="Try a broader location or clear the search text. Clinic names are currently filtered from the active clinic associations returned by the dentist search API."
          />
        )}

        {!loading && !error && page < lastPage && (
          <Pressable
            onPress={() => void loadPage(page + 1, false)}
            disabled={loadingMore}
            style={{
              minHeight: 46,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.primary,
              marginTop: 8,
              backgroundColor: colors.surface,
            }}
          >
            {loadingMore ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <AppText style={{ color: colors.primary, fontWeight: '700' }}>Load more</AppText>
            )}
          </Pressable>
        )}

        <AppText style={{ color: colors.textMuted, fontSize: 10, lineHeight: 15, marginTop: 14 }}>
          Search results include dentists associated with active clinics. Ratings, consultation fees, distance and reviews are not currently returned by this public API.
        </AppText>
      </ScrollView>

      {isAuthenticated ? <TabBar /> : <PublicBookingTabBar />}

    </View>
  );
}

function EmptyState({ title, message }: { title: string; message: string }) {
  const colors = useAppColors();

  return (
    <View
      style={{
        padding: 24,
        alignItems: 'center',
        borderRadius: 16,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <IconSymbol name="magnifyingglass" size={30} color={colors.textMuted} />
      <AppText style={{ color: colors.text, fontSize: 16, fontWeight: '700', marginTop: 12 }}>
        {title}
      </AppText>
      <AppText style={{ color: colors.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 19, fontSize: 12 }}>
        {message}
      </AppText>
    </View>
  );
}
