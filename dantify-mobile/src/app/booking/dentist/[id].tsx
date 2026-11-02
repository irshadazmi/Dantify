import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppText } from '@/components/ui/app-text';
import { useAppColors } from '@/hooks/use-app-colors';
import { useStyles } from '@/styles/styles';
import dentistSearchService, {
  type PublicSearchDentist,
} from '@/services/dentist-search-service';

export default function DentistDetailsScreen() {
  const router = useRouter();
  const styles = useStyles();
  const colors = useAppColors();

  const params = useLocalSearchParams<{ id: string; name?: string }>();
  const dentistId = Number(params.id);

  const [dentist, setDentist] = React.useState<PublicSearchDentist | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function loadDentist() {
      if (!Number.isInteger(dentistId) || dentistId <= 0) {
        setError('Invalid dentist profile.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await dentistSearchService.getPublicById(dentistId);
        if (!cancelled) setDentist(result);
      } catch (requestError) {
        console.warn('[PublicDentistProfile] Could not load profile.', requestError);
        if (!cancelled) {
          setError('Unable to load this dentist profile. Please try again.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadDentist();
    return () => {
      cancelled = true;
    };
  }, [dentistId]);

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.background,
          },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <AppText style={{ marginTop: 12 }}>Loading dentist profile...</AppText>
      </View>
    );
  }

  if (error || !dentist) {
    return (
      <View
        style={[
          styles.container,
          { flex: 1, backgroundColor: colors.background },
        ]}
      >
        <AppText style={styles.title}>Dentist Details</AppText>
        <AppText style={{ marginTop: 12, color: colors.danger }}>
          {error ?? 'Dentist profile not found.'}
        </AppText>
        <Pressable
          onPress={() => router.back()}
          style={[styles.button, { marginTop: 20 }]}
        >
          <AppText style={styles.buttonText}>Back to Results</AppText>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        style={{ marginBottom: 20 }}
      >
        <AppText style={{ color: colors.primary }}>‹ Back to results</AppText>
      </Pressable>

      <View
        style={{
          padding: 20,
          borderRadius: 18,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: 76,
            height: 76,
            borderRadius: 38,
            backgroundColor: colors.background,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <AppText style={{ fontSize: 34 }}>🦷</AppText>
        </View>
        <AppText style={[styles.title, { textAlign: 'center', marginTop: 14 }]}>
          {dentist.name}
        </AppText>
        <AppText
          style={{
            textAlign: 'center',
            color: colors.textMuted,
            marginTop: 6,
          }}
        >
          {dentist.specialization || 'Dental Practitioner'}
        </AppText>
      </View>

      <AppText style={[styles.title, { marginTop: 24, marginBottom: 12 }]}>
        Professional Details
      </AppText>
      <View
        style={{
          padding: 16,
          borderRadius: 14,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          gap: 14,
        }}
      >
        <DetailRow label="Name" value={dentist.name} />
        <DetailRow label="Specialization" value={dentist.specialization} />
        <DetailRow label="Gender" value={dentist.gender} />
      </View>

      {(dentist.phone || dentist.email) && (
        <>
          <AppText style={[styles.title, { marginTop: 24, marginBottom: 12 }]}>
            Contact Information
          </AppText>
          <View
            style={{
              padding: 16,
              borderRadius: 14,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              gap: 14,
            }}
          >
            <DetailRow label="Phone" value={dentist.phone} />
            <DetailRow label="Email" value={dentist.email} />
          </View>
        </>
      )}

      <AppText style={[styles.title, { marginTop: 24, marginBottom: 12 }]}>
        Associated Clinics
      </AppText>
      {dentist.clinics.length > 0 ? (
        dentist.clinics.map((clinic) => (
          <View
            key={clinic.id}
            style={{
              padding: 16,
              marginBottom: 10,
              borderRadius: 14,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              gap: 6,
            }}
          >
            <AppText style={{ fontWeight: '700' }}>{clinic.name}</AppText>
            <AppText style={{ color: colors.textMuted }}>
              {[clinic.address, clinic.city, clinic.state, clinic.postal_code]
                .filter(Boolean)
                .join(', ') || 'Clinic address not listed'}
            </AppText>
            {clinic.phone ? (
              <DetailRow label="Clinic phone" value={clinic.phone} />
            ) : null}
          </View>
        ))
      ) : (
        <AppText style={{ color: colors.textMuted }}>
          No active clinic associations are currently listed.
        </AppText>
      )}

      <AppText
        style={{
          marginTop: 12,
          color: colors.textMuted,
          lineHeight: 20,
        }}
      >
        Clinic schedules, available services, fees and appointment slots
        will be shown when the corresponding booking data is connected.
      </AppText>

      <Pressable
        onPress={() => {
          router.push({
            pathname: '/booking/availability',
            params: { dentistId: String(dentist.id) },
          });
        }}
        accessibilityRole="button"
        style={[styles.button, { marginTop: 24 }]}
      >
        <AppText style={styles.buttonText}>Check Appointment Availability</AppText>
      </Pressable>
    </ScrollView>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  const colors = useAppColors();
  if (!value) return null;

  return (
    <View style={{ gap: 4 }}>
      <AppText style={{ fontSize: 12, color: colors.textMuted }}>{label}</AppText>
      <AppText>{value}</AppText>
    </View>
  );
}
