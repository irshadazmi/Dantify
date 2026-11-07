import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import clinicService from '@/services/clinic-service';
import type { Clinic } from '@/types/clinic';
import { AppText } from '@/components/ui/app-text';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useAppColors } from '@/hooks/use-app-colors';
import { useStyles } from '@/styles/styles';

export default function ClinicProfileIndex() {
  const styles = useStyles();
  const colors = useAppColors();
  const router = useRouter();

  const [clinic, setClinic] = React.useState<Clinic | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadProfile = React.useCallback(async (pullToRefresh = false) => {
    if (pullToRefresh) setRefreshing(true);
    else setLoading(true);

    setError(null);

    try {
      const response = await clinicService.getMyProfile();
      setClinic(response.data ?? null);
    } catch (err: any) {
      if (
        err?.response?.status === 404 &&
        err?.response?.data?.next_step === 'create_profile'
      ) {
        setClinic(null);
      } else {
        setError(
          err?.response?.data?.message ||
            'Unable to load your clinic profile.',
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  if (loading) {
    return (
      <View style={styles.profileLoading}>
        <ActivityIndicator size="large" color={colors.primary} />
        <AppText>Loading clinic profile...</AppText>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.profileScroll}
      contentContainerStyle={styles.profileScrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void loadProfile(true)}
          tintColor={colors.primary}
        />
      }
    >
      <ScreenHeader
        title="My Clinic Profile"
        subtitle="Manage your professional information and profile photo."
      />

      {error ? (
        <AppText variant="error" style={styles.profileError}>
          {error}
        </AppText>
      ) : null}

      {!clinic ? (
        <View style={styles.profileEmptyCard}>
          <AppText style={styles.profileEmptyIcon}>🦷</AppText>
          <AppText style={styles.profileEmptyTitle}>
            No clinic profile found
          </AppText>
          <AppText style={styles.profileEmptyDescription}>
            Create your professional profile to manage your clinic information.
          </AppText>
          <Pressable
            onPress={() => router.push('/profiles/clinic/create' as never)}
            style={styles.button}
            accessibilityRole="button"
          >
            <AppText style={styles.buttonText}>Create Clinic Profile</AppText>
          </Pressable>
        </View>
      ) : (
        <View style={styles.profileCard}>
          <View style={styles.profileAvatarSection}>
            <View style={styles.profileAvatar}>
              {clinic.profile_photo_url ? (
                <Image
                  source={{ uri: clinic.profile_photo_url }}
                  style={styles.profileAvatarImage}
                  resizeMode="cover"
                />
              ) : (
                <AppText style={styles.profileAvatarPlaceholder}>🏥</AppText>
              )}
            </View>

            <AppText style={[styles.title, styles.profileName]}>
              {clinic.name}
            </AppText>
          </View>

          <View style={styles.profileInfoList}>
            <InfoRow label="Phone" value={clinic.phone} />
            <InfoRow label="Email" value={clinic.email} />
            <InfoRow
              label="Address"
              value={[
                clinic.address,
                clinic.city,
                clinic.state,
                clinic.postal_code,
                clinic.country,
              ].filter(Boolean).join(', ')}
            />
          </View>

          <Pressable
            onPress={() =>
              router.push(`/profiles/clinic/${clinic.id}/edit` as never)
            }
            style={[styles.button, styles.profileEditButton]}
            accessibilityRole="button"
          >
            <AppText style={styles.buttonText}>Edit Clinic Profile</AppText>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  const styles = useStyles();
  if (!value) return null;

  return (
    <View style={styles.profileInfoItem}>
      <AppText style={styles.profileInfoLabel}>{label}</AppText>
      <AppText>{value}</AppText>
    </View>
  );
}
