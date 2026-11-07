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

import dentistService from '@/services/dentist-service';
import type { Dentist } from '@/types/dentist';
import { AppText } from '@/components/ui/app-text';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useAppColors } from '@/hooks/use-app-colors';
import { useStyles } from '@/styles/styles';

export default function DentistProfileIndex() {
  const styles = useStyles();
  const colors = useAppColors();
  const router = useRouter();

  const [dentist, setDentist] = React.useState<Dentist | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadProfile = React.useCallback(async (pullToRefresh = false) => {
    if (pullToRefresh) setRefreshing(true);
    else setLoading(true);

    setError(null);

    try {
      const response = await dentistService.getMyProfile();
      setDentist(response.data ?? null);
    } catch (err: any) {
      if (
        err?.response?.status === 404 &&
        err?.response?.data?.next_step === 'create_profile'
      ) {
        setDentist(null);
      } else {
        setError(
          err?.response?.data?.message ||
            'Unable to load your dentist profile.',
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
        <AppText>Loading dentist profile...</AppText>
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
        title="My Dentist Profile"
        subtitle="Manage your professional information and profile photo."
      />

      {error ? (
        <AppText variant="error" style={styles.profileError}>
          {error}
        </AppText>
      ) : null}

      {!dentist ? (
        <View style={styles.profileEmptyCard}>
          <AppText style={styles.profileEmptyIcon}>🦷</AppText>
          <AppText style={styles.profileEmptyTitle}>
            No dentist profile found
          </AppText>
          <AppText style={styles.profileEmptyDescription}>
            Create your professional profile to manage your dentist information.
          </AppText>
          <Pressable
            onPress={() => router.push('/profiles/dentist/create' as never)}
            style={styles.button}
            accessibilityRole="button"
          >
            <AppText style={styles.buttonText}>Create Dentist Profile</AppText>
          </Pressable>
        </View>
      ) : (
        <View style={styles.profileCard}>
          <View style={styles.profileAvatarSection}>
            <View style={styles.profileAvatar}>
              {dentist.profile_photo_url ? (
                <Image
                  source={{ uri: dentist.profile_photo_url }}
                  style={styles.profileAvatarImage}
                  resizeMode="cover"
                />
              ) : (
                <AppText style={styles.profileAvatarPlaceholder}>👨‍⚕️</AppText>
              )}
            </View>

            <AppText style={[styles.title, styles.profileName]}>
              {dentist.name}
            </AppText>
            <AppText style={styles.profileSpecialization}>
              {dentist.specialization || 'Dental Practitioner'}
            </AppText>
          </View>

          <View style={styles.profileInfoList}>
            <InfoRow label="Gender" value={dentist.gender} />
            <InfoRow label="Phone" value={dentist.phone} />
            <InfoRow label="Email" value={dentist.email} />
            <InfoRow
              label="Address"
              value={[
                dentist.address,
                dentist.city,
                dentist.state,
                dentist.postal_code,
                dentist.country,
              ].filter(Boolean).join(', ')}
            />
          </View>

          <Pressable
            onPress={() =>
              router.push(`/profiles/dentist/${dentist.id}/edit` as never)
            }
            style={[styles.button, styles.profileEditButton]}
            accessibilityRole="button"
          >
            <AppText style={styles.buttonText}>Edit Dentist Profile</AppText>
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
