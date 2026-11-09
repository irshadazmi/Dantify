import React from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppText } from '@/components/ui/app-text';
import PublicBookingTabBar from '@/components/booking/public-booking-tab-bar';
import PublicBookingHeader from '@/components/booking/public-booking-header';
import { useAuth } from '@/contexts/auth-context';
import { useAppColors } from '@/hooks/use-app-colors';
import { useStyles } from '@/styles/styles';
import dentistSearchService, {
  type PublicSearchDentist,
  type PublicSearchClinic,
} from '@/services/dentist-search-service';

function normalize(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function clinicAddress(clinic: PublicSearchClinic): string {
  return [
    clinic.address,
    clinic.city,
    clinic.state,
    clinic.postal_code,
    clinic.country,
  ]
    .filter(Boolean)
    .join(', ');
}

/**
 * Collapse repeated association rows while preserving different clinic
 * branches. Prefer the clinic ID; the normalized content key also catches
 * duplicate records returned with different IDs.
 */
function getUniqueClinics(
  clinics: PublicSearchClinic[] | null | undefined,
): PublicSearchClinic[] {
  const seenIds = new Set<number>();
  const seenDetails = new Set<string>();
  const result: PublicSearchClinic[] = [];

  for (const clinic of clinics ?? []) {
    if (seenIds.has(clinic.id)) continue;

    const name = normalize(clinic.name);
    const address = normalize(clinicAddress(clinic));
    const phone = normalize(clinic.phone);

    // Only use content-based deduplication when there is enough location
    // information to distinguish branches reliably.
    const detailsKey = address
      ? `${name}|${address}|${phone}`
      : '';

    if (detailsKey && seenDetails.has(detailsKey)) continue;

    seenIds.add(clinic.id);
    if (detailsKey) seenDetails.add(detailsKey);
    result.push(clinic);
  }

  return result;
}

function SectionHeading({ title }: { title: string }) {
  const colors = useAppColors();

  return (
    <AppText
      style={{
        color: colors.text,
        fontSize: 17,
        fontWeight: '800',
        marginTop: 23,
        marginBottom: 11,
      }}
    >
      {title}
    </AppText>
  );
}

function DetailRow({
  symbol,
  label,
  value,
  onPress,
}: {
  symbol: string;
  label: string;
  value: string;
  onPress?: () => void;
}) {
  const colors = useAppColors();

  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 11,
      }}
    >
      <View
        style={{
          width: 39,
          height: 39,
          borderRadius: 12,
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AppText
          style={{
            color: colors.primary,
            fontSize: 19,
            fontWeight: '700',
          }}
        >
          {symbol}
        </AppText>
      </View>

      <View style={{ flex: 1, gap: 3 }}>
        <AppText style={{ color: colors.textMuted, fontSize: 11 }}>
          {label}
        </AppText>
        <AppText
          style={{
            color: onPress ? colors.primary : colors.text,
            fontSize: 13,
            fontWeight: '600',
            lineHeight: 19,
          }}
        >
          {value}
        </AppText>
      </View>

      {onPress ? (
        <AppText style={{ color: colors.textMuted, fontSize: 20 }}>›</AppText>
      ) : null}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
    >
      {content}
    </Pressable>
  );
}

export default function DentistDetailsScreen() {
  const router = useRouter();
  const styles = useStyles();
  const colors = useAppColors();
  const { isAuthenticated } = useAuth();

  const params = useLocalSearchParams<{ id?: string | string[]; location?: string | string[] }>();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const dentistId = Number(rawId);
  const rawLocation = Array.isArray(params.location) ? params.location[0] : params.location;
  const [location, setLocation] = React.useState(rawLocation || 'Pune, Maharashtra');

  const [dentist, setDentist] = React.useState<PublicSearchDentist | null>(null);
  const [clinics, setClinics] = React.useState<PublicSearchClinic[]>([]);
  const [selectedClinicId, setSelectedClinicId] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [retryKey, setRetryKey] = React.useState(0);
  const [photoFailed, setPhotoFailed] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      if (!Number.isInteger(dentistId) || dentistId <= 0) {
        setDentist(null);
        setClinics([]);
        setError('The dentist profile link is invalid.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setPhotoFailed(false);

      try {
        // IMPORTANT: use the public discovery endpoint.
        // dentistService.getById() calls /dentists/{id}, which is protected
        // by auth:sanctum and returns 401 for guest users.
        const result = await dentistSearchService.getPublicById(dentistId);

        if (cancelled) return;

        const uniqueClinics = getUniqueClinics(result.clinics);

        setDentist(result);
        setClinics(uniqueClinics);
        setSelectedClinicId(uniqueClinics[0]?.id ?? null);
      } catch (requestError) {
        console.warn(
          '[PublicDentistProfile] Could not load public dentist profile.',
          requestError,
        );

        if (!cancelled) {
          setDentist(null);
          setClinics([]);
          setError(
            'Unable to load this dentist profile. Please check your connection and try again.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [dentistId, retryKey]);

  const openPhone = React.useCallback(async (phone: string) => {
    try {
      await Linking.openURL(`tel:${phone}`);
    } catch (openError) {
      console.warn('[PublicDentistProfile] Could not open phone dialer.', openError);
    }
  }, []);

  const openEmail = React.useCallback(async (email: string) => {
    try {
      await Linking.openURL(`mailto:${email}`);
    } catch (openError) {
      console.warn('[PublicDentistProfile] Could not open email client.', openError);
    }
  }, []);

  const handleAppointment = () => {
    if (!dentist || clinics.length === 0) return;

    const bookingParams = {
      dentistId: String(dentist.id),
      ...(selectedClinicId ? { clinicId: String(selectedClinicId) } : {}),
    };

    if (!isAuthenticated) {
      router.push({
        pathname: '/(auth)/login',
        params: {
          ...bookingParams,
          redirectTo: '/booking/availability',
        },
      } as never);
      return;
    }

    router.push({
      pathname: '/booking/availability',
      params: bookingParams,
    } as never);
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <AppText style={{ marginTop: 13, color: colors.textSecondary }}>
          Loading dentist profile...
        </AppText>
      </View>
    );
  }

  if (error || !dentist) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          padding: 20,
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            alignItems: 'center',
            padding: 24,
            borderRadius: 19,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View
            style={{
              width: 58,
              height: 58,
              borderRadius: 29,
              backgroundColor: colors.background,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppText style={{ color: colors.primary, fontSize: 31, fontWeight: '700' }}>
              !
            </AppText>
          </View>

          <AppText
            style={{
              fontSize: 18,
              fontWeight: '800',
              color: colors.text,
              marginTop: 14,
            }}
          >
            Profile unavailable
          </AppText>

          <AppText
            style={{
              color: colors.textMuted,
              textAlign: 'center',
              marginTop: 8,
              lineHeight: 21,
            }}
          >
            {error ?? 'Dentist profile not found.'}
          </AppText>

          <Pressable
            onPress={() => setRetryKey((value) => value + 1)}
            accessibilityRole="button"
            style={[
              styles.button,
              { marginTop: 20, width: '100%', minHeight: 48 },
            ]}
          >
            <AppText style={styles.buttonText}>Try Again</AppText>
          </Pressable>

          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            style={{ padding: 14 }}
          >
            <AppText style={{ color: colors.primary, fontWeight: '700' }}>
              Back to Results
            </AppText>
          </Pressable>
        </View>
      </View>
    );
  }

  // profile_photo_url is returned by the newer public search API.
  // The in-operator keeps this screen compatible with older service typings.
  const photoUrl =
    'profile_photo_url' in dentist &&
    typeof dentist.profile_photo_url === 'string' &&
    dentist.profile_photo_url.length > 0
      ? dentist.profile_photo_url
      : null;

  const hasContact = Boolean(dentist.phone || dentist.email);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 18, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {!isAuthenticated ? (
          <PublicBookingHeader location={location} onLocationChange={setLocation} />
        ) : null}

        {/* Dentist identity */}
        <View
          style={{
            padding: 22,
            borderRadius: 20,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 104,
              height: 104,
              borderRadius: 52,
              backgroundColor: colors.background,
              borderWidth: 2,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {photoUrl && !photoFailed ? (
              <Image
                source={{ uri: photoUrl }}
                onError={() => setPhotoFailed(true)}
                resizeMode="cover"
                style={{ width: '100%', height: '100%' }}
                accessibilityLabel={`${dentist.name} profile photo`}
              />
            ) : (
              <AppText style={{ fontSize: 43 }}>🦷</AppText>
            )}
          </View>

          <AppText
            style={{
              color: colors.text,
              fontSize: 22,
              fontWeight: '800',
              textAlign: 'center',
              marginTop: 15,
            }}
          >
            {dentist.name}
          </AppText>
        </View>

        {/* Professional information */}
        <SectionHeading title="Professional Information" />
        <View
          style={{
            paddingHorizontal: 15,
            borderRadius: 16,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          {dentist.specialization ? (
            <DetailRow
              symbol="✚"
              label="Specialization"
              value={dentist.specialization}
            />
          ) : null}

          {dentist.gender ? (
            <>
              {dentist.specialization ? (
                <View style={{ height: 1, backgroundColor: colors.border }} />
              ) : null}
              <DetailRow symbol="◉" label="Gender" value={dentist.gender} />
            </>
          ) : null}

          {!dentist.specialization && !dentist.gender ? (
            <AppText style={{ color: colors.textMuted, paddingVertical: 13, fontSize: 13 }}>
              Additional professional information is not available.
            </AppText>
          ) : null}
        </View>

        {/* Contact information */}
        {hasContact ? (
          <>
            <SectionHeading title="Contact Information" />
            <View
              style={{
                paddingHorizontal: 15,
                borderRadius: 16,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              {dentist.phone ? (
                <DetailRow
                  symbol="☎"
                  label="Phone number"
                  value={dentist.phone}
                  onPress={() => void openPhone(dentist.phone!)}
                />
              ) : null}

              {dentist.phone && dentist.email ? (
                <View style={{ height: 1, backgroundColor: colors.border }} />
              ) : null}

              {dentist.email ? (
                <DetailRow
                  symbol="✉"
                  label="Email address"
                  value={dentist.email}
                  onPress={() => void openEmail(dentist.email!)}
                />
              ) : null}
            </View>
          </>
        ) : null}

        {/* Associated clinics */}
        <SectionHeading title="Associated Clinics" />

        {clinics.length > 0 ? (
          <View style={{ gap: 11 }}>
            {clinics.map((clinic) => {
              const selected = clinic.id === selectedClinicId;
              const address = clinicAddress(clinic);

              return (
                <Pressable
                  key={clinic.id}
                  onPress={() => setSelectedClinicId(clinic.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={{
                    padding: 15,
                    borderRadius: 16,
                    backgroundColor: colors.surface,
                    borderWidth: selected ? 2 : 1,
                    borderColor: selected ? colors.primary : colors.border,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 11 }}>
                    <View
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        backgroundColor: colors.background,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <AppText style={{ color: colors.primary, fontSize: 20 }}>▦</AppText>
                    </View>

                    <View style={{ flex: 1, gap: 5 }}>
                      <AppText style={{ color: colors.text, fontSize: 15, fontWeight: '800' }}>
                        {clinic.name}
                      </AppText>

                      {address ? (
                        <AppText style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 19 }}>
                          {address}
                        </AppText>
                      ) : (
                        <AppText style={{ color: colors.textMuted, fontSize: 12 }}>
                          Clinic address not listed
                        </AppText>
                      )}

                      {clinic.phone ? (
                        <AppText style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                          ☎ {clinic.phone}
                        </AppText>
                      ) : null}

                      {clinic.email ? (
                        <AppText style={{ color: colors.textMuted, fontSize: 12 }}>
                          ✉ {clinic.email}
                        </AppText>
                      ) : null}
                    </View>

                    <View
                      style={{
                        width: 21,
                        height: 21,
                        borderRadius: 11,
                        borderWidth: 1.5,
                        borderColor: selected ? colors.primary : colors.border,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {selected ? (
                        <View
                          style={{
                            width: 11,
                            height: 11,
                            borderRadius: 6,
                            backgroundColor: colors.primary,
                          }}
                        />
                      ) : null}
                    </View>
                  </View>

                  <AppText
                    style={{
                      color: selected ? colors.primary : colors.textMuted,
                      fontSize: 11,
                      fontWeight: '700',
                      marginTop: 10,
                      textAlign: 'right',
                    }}
                  >
                    {selected ? 'Selected clinic' : 'Tap to select this clinic'}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View
            style={{
              padding: 16,
              borderRadius: 15,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <AppText style={{ color: colors.textMuted, fontSize: 13, lineHeight: 20 }}>
              No active clinic associations are currently listed for this dentist.
            </AppText>
          </View>
        )}

        <View
          style={{
            marginTop: 20,
            padding: 15,
            borderRadius: 15,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <AppText style={{ color: colors.text, fontWeight: '800', fontSize: 14 }}>
            Appointment Information
          </AppText>
          <AppText style={{ color: colors.textMuted, fontSize: 12, lineHeight: 19, marginTop: 7 }}>
            Select a clinic and check its available services, appointment dates and time slots.
          </AppText>
        </View>
      </ScrollView>

      {/* Fixed booking action */}
      <View
        style={{
          paddingHorizontal: 18,
          paddingTop: 12,
          paddingBottom: 14,
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <Pressable
          onPress={handleAppointment}
          disabled={clinics.length === 0}
          accessibilityRole="button"
          accessibilityLabel="Check appointment availability"
          style={({ pressed }) => [
            styles.button,
            {
              marginTop: 0,
              minHeight: 54,
              borderRadius: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 9,
              opacity: clinics.length === 0 ? 0.45 : pressed ? 0.85 : 1,
            },
          ]}
        >
          <AppText style={{ color: colors.badgeText, fontSize: 17 }}>▣</AppText>
          <AppText style={styles.buttonText}>Check Appointment Availability</AppText>
        </Pressable>
      </View>

      {!isAuthenticated ? <PublicBookingTabBar /> : null}
    </View>
  );
}
