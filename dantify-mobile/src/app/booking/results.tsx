import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppText } from '@/components/ui/app-text';
import { IconSymbol } from '@/components/icon-symbol';
import { useAppColors } from '@/hooks/use-app-colors';
import { useStyles } from '@/styles/styles';
import dentistSearchService, {
  type PublicSearchDentist,
} from '@/services/dentist-search-service';

type ResultType = 'dentists' | 'clinics';

/**
 * A location typed into the main search field can arrive as `query` as well
 * as `location`. The API treats these as separate filters, so avoid applying
 * the city as a dentist-name/specialization filter.
 */
function normalizeSearchText(value: string): string {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function isLocationOnlyQuery(query: string, location: string): boolean {
  if (!query || !location) return false;

  const normalizedQuery = normalizeSearchText(query);
  const normalizedLocation = normalizeSearchText(location);
  const city = normalizeSearchText(location.split(',')[0] ?? '');

  return (
    normalizedQuery === normalizedLocation ||
    (city.length > 0 && normalizedQuery === city)
  );
}

function uniqueDentistClinics(dentist: PublicSearchDentist) {
  const seen = new Set<number>();
  return (dentist.clinics ?? []).filter((clinic) => {
    if (seen.has(clinic.id)) return false;
    seen.add(clinic.id);
    return true;
  });
}

function dentistLocation(dentist: PublicSearchDentist): string {
  const clinic = dentist.clinics?.[0];
  if (!clinic) return 'Clinic location not listed';

  const locality = [clinic.city, clinic.state].filter(Boolean).join(', ');
  return locality || clinic.address || 'Clinic location not listed';
}

export default function SearchResultsScreen() {
  const router = useRouter();
  const styles = useStyles();
  const colors = useAppColors();

  const params = useLocalSearchParams<{
    query?: string;
    location?: string;
    language?: string;
    type?: string;
  }>();

  const query = typeof params.query === 'string' ? params.query.trim() : '';
  const location =
    typeof params.location === 'string' ? params.location.trim() : '';

  // Example: query="Pune", location="Pune, Maharashtra" means
  // "show dentists in Pune", not "find a dentist named Pune".
  const searchQuery = isLocationOnlyQuery(query, location) ? '' : query;

  const [resultType, setResultType] = useState<ResultType>(
    params.type === 'clinics' ? 'clinics' : 'dentists',
  );

  const [dentists, setDentists] = useState<PublicSearchDentist[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const runSearch = useCallback(async (requestedPage = 1) => {
    if (resultType !== 'dentists') return;

    if (requestedPage === 1) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await dentistSearchService.search({
        query: searchQuery || undefined,
        location: location || undefined,
        page: requestedPage,
        per_page: 15,
      });

      const pagination = response.data;
      setDentists((current) =>
        requestedPage === 1
          ? pagination.data
          : [...current, ...pagination.data],
      );
      setPage(pagination.current_page);
      setLastPage(pagination.last_page);
      setTotal(pagination.total);
    } catch (requestError) {
      console.warn('[BookingSearch] Dentist search failed.', requestError);
      if (requestedPage === 1) setDentists([]);
      setError(
        'We could not load dentist profiles. Please check your connection and try again.',
      );
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [location, searchQuery, resultType]);

  useEffect(() => {
    if (resultType === 'dentists') {
      void runSearch(1);
    }
  }, [resultType, runSearch]);

  const openDentist = (dentist: PublicSearchDentist) => {
    router.push({
      pathname: '/booking/dentist/[id]',
      params: {
        id: String(dentist.id),
        name: dentist.name,
        type: 'dentists',
      },
    });
  };

  const tabButton = (type: ResultType) => {
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
          paddingVertical: 11,
          borderRadius: 11,
          backgroundColor: selected ? colors.primary : 'transparent',
        }}
      >
        <AppText
          style={{
            color: selected ? colors.badgeText : colors.text,
            fontWeight: '600',
          }}
        >
          {type === 'dentists' ? 'Dentists' : 'Clinics'}
        </AppText>
      </Pressable>
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
      <View style={{ marginBottom: 20 }}>
        <View
          style={{
            minHeight: 42,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/' as never);
              }
            }}
            accessibilityRole="button"
            accessibilityLabel="Back to previous screen"
            hitSlop={8}
            style={{
              minWidth: 76,
              minHeight: 40,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-start',
              paddingRight: 8,
            }}
          >
            <AppText
              style={{
                color: colors.primary,
                fontSize: 15,
                fontWeight: '700',
              }}
            >
              {'‹  Back'}
            </AppText>
          </Pressable>

          <View style={{ flex: 1, alignItems: 'center' }}>
            <AppText style={styles.title}>Search Results</AppText>
          </View>

          {/* Balances the Back action so the title remains truly centered. */}
          <View style={{ minWidth: 76 }} />
        </View>

        <AppText
          style={{
            color: colors.textMuted,
            marginTop: 4,
            textAlign: 'center',
          }}
        >
          {location || 'All locations'}
        </AppText>
      </View>

      <View
        style={{
          padding: 14,
          borderRadius: 14,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 18,
        }}
      >
        <AppText style={{ color: colors.textMuted, fontSize: 12 }}>
          YOUR SEARCH
        </AppText>
        <AppText style={{ marginTop: 5, fontWeight: '600' }}>
          {searchQuery || 'All dentists'}
        </AppText>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          style={{ marginTop: 10, alignSelf: 'flex-start' }}
        >
          <AppText style={{ color: colors.primary, fontWeight: '600' }}>
            Edit search
          </AppText>
        </Pressable>
      </View>

      <View
        style={{
          flexDirection: 'row',
          padding: 4,
          borderRadius: 14,
          backgroundColor: colors.surface,
          marginBottom: 16,
        }}
      >
        {tabButton('dentists')}
        {tabButton('clinics')}
      </View>

      {resultType === 'clinics' ? (
        <View
          style={{
            padding: 18,
            borderRadius: 15,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <IconSymbol name="info" size={23} color={colors.primary} />
          <AppText style={{ fontWeight: '700', marginTop: 10 }}>
            Clinic search is not connected yet
          </AppText>
          <AppText style={{ color: colors.textMuted, marginTop: 6, lineHeight: 20 }}>
            The supplied public API currently searches dentists and returns
            their active clinic associations. A dedicated clinic search
            endpoint can be connected separately.
          </AppText>
        </View>
      ) : (
        <>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 13,
            }}
          >
            <AppText style={{ color: colors.textMuted }}>
              {loading ? 'Searching dentists...' : `${total} dentist${total === 1 ? '' : 's'} found`}
            </AppText>
            <Pressable
              onPress={() => void runSearch(1)}
              disabled={loading}
              accessibilityRole="button"
              style={{ padding: 5 }}
            >
              <AppText style={{ color: colors.primary, fontWeight: '600' }}>
                Refresh
              </AppText>
            </Pressable>
          </View>

          {loading ? (
            <View style={{ paddingVertical: 35, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <AppText style={{ color: colors.textMuted, marginTop: 12 }}>
                Finding dentists near {location || 'you'}...
              </AppText>
            </View>
          ) : error ? (
            <View
              style={{
                padding: 18,
                borderRadius: 15,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <AppText style={{ color: colors.danger }}>{error}</AppText>
              <Pressable
                onPress={() => void runSearch(1)}
                style={{ marginTop: 12 }}
              >
                <AppText style={{ color: colors.primary, fontWeight: '700' }}>
                  Try again
                </AppText>
              </Pressable>
            </View>
          ) : dentists.length === 0 ? (
            <View
              style={{
                padding: 20,
                alignItems: 'center',
                borderRadius: 15,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <IconSymbol name="magnifyingglass" size={28} color={colors.textMuted} />
              <AppText style={{ fontWeight: '700', marginTop: 12 }}>
                No dentists found
              </AppText>
              <AppText
                style={{
                  color: colors.textMuted,
                  textAlign: 'center',
                  marginTop: 6,
                  lineHeight: 19,
                }}
              >
                Try another dentist name or specialization, or change your location.
              </AppText>
            </View>
          ) : (
            dentists.map((dentist) => (
              <Pressable
                key={dentist.id}
                onPress={() => openDentist(dentist)}
                accessibilityRole="button"
                accessibilityLabel={`View ${dentist.name} profile`}
                style={{
                  padding: 15,
                  marginBottom: 12,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                }}
              >
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                  <View
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: 15,
                      overflow: 'hidden',
                      backgroundColor: colors.background,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {dentist.profile_photo_url ? (
                      <Image
                        source={{ uri: dentist.profile_photo_url }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                    ) : (
                      <IconSymbol
                        name="person.fill"
                        size={27}
                        color={colors.primary}
                      />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText style={{ fontWeight: '700', fontSize: 16 }}>
                      {dentist.name}
                    </AppText>
                    <AppText style={{ color: colors.textMuted, marginTop: 4 }}>
                      {dentist.specialization || 'Dental Practitioner'}
                    </AppText>
                    <AppText style={{ color: colors.textSecondary, marginTop: 6 }}>
                      {dentistLocation(dentist)}
                    </AppText>
                  </View>
                  <IconSymbol name="chevron.right" size={18} color={colors.textSecondary} />
                </View>

                {uniqueDentistClinics(dentist).length > 0 && (
                  <View
                    style={{
                      marginTop: 12,
                      paddingTop: 10,
                      borderTopWidth: 1,
                      borderTopColor: colors.border,
                    }}
                  >
                    <AppText style={{ color: colors.textMuted, fontSize: 12 }}>
                      {uniqueDentistClinics(dentist).length === 1
                        ? 'Available at'
                        : `Available at ${uniqueDentistClinics(dentist).length} clinics`}
                    </AppText>
                    {uniqueDentistClinics(dentist).slice(0, 2).map((clinic) => (
                      <AppText
                        key={clinic.id}
                        style={{ color: colors.text, fontSize: 13, marginTop: 4 }}
                        numberOfLines={1}
                      >
                        {clinic.name}
                      </AppText>
                    ))}
                  </View>
                )}
                <View style={{ alignItems: 'flex-end', marginTop: 10 }}>
                  <AppText style={{ color: colors.primary, fontWeight: '700' }}>
                    View profile →
                  </AppText>
                </View>
              </Pressable>
            ))
          )}

          {!loading && !error && dentists.length > 0 && page < lastPage && (
            <Pressable
              onPress={() => void runSearch(page + 1)}
              disabled={loadingMore}
              style={{
                minHeight: 46,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                marginTop: 4,
              }}
            >
              {loadingMore ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <AppText style={{ color: colors.primary, fontWeight: '700' }}>
                  Load more dentists
                </AppText>
              )}
            </Pressable>
          )}
        </>
      )}
    </ScrollView>
  );
}
