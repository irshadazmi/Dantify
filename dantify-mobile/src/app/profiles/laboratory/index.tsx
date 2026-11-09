import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import laboratoryService from '@/services/laboratory-service';
import type { Laboratory } from '@/types/laboratory';
import { AppText } from '@/components/ui/app-text';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useAppColors } from '@/hooks/use-app-colors';
import { useStyles } from '@/styles/styles';

export default function LaboratoryProfileIndex() {
  const styles = useStyles();
  const colors = useAppColors();
  const router = useRouter();

  const [laboratory, setLaboratory] = React.useState<Laboratory | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadProfile = React.useCallback(async (pullToRefresh = false) => {
    if (pullToRefresh) setRefreshing(true);
    else setLoading(true);

    setError(null);

    try {
      const response = await laboratoryService.getMyProfile();
      setLaboratory(response.data ?? null);
    } catch (err: any) {
      if (
        err?.response?.status === 404 &&
        err?.response?.data?.next_step === 'create_profile'
      ) {
        setLaboratory(null);
      } else {
        setError(
          err?.response?.data?.message ||
            'Unable to load your laboratory profile.',
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
        <AppText>Loading laboratory profile...</AppText>
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
        title="My Laboratory Profile"
        subtitle="Manage your professional information and profile photo."
      />

      {error ? (
        <AppText variant="error" style={styles.profileError}>
          {error}
        </AppText>
      ) : null}

      {!laboratory ? (
        <View style={styles.profileEmptyCard}>
          <AppText style={styles.profileEmptyIcon}>🦷</AppText>
          <AppText style={styles.profileEmptyTitle}>
            No laboratory profile found
          </AppText>
          <AppText style={styles.profileEmptyDescription}>
            Create your professional profile to manage your laboratory information.
          </AppText>
          <Pressable
            onPress={() => router.push('/profiles/laboratory/create' as never)}
            style={styles.button}
            accessibilityRole="button"
          >
            <AppText style={styles.buttonText}>Create Laboratory Profile</AppText>
          </Pressable>
        </View>
      ) : (
        <View style={styles.profileCard}>
          <View style={styles.profileAvatarSection}>
            <View style={styles.profileAvatar}>
              {laboratory.profile_photo_url ? (
                <Image
                  source={{ uri: laboratory.profile_photo_url }}
                  style={styles.profileAvatarImage}
                  resizeMode="cover"
                />
              ) : (
                <AppText style={styles.profileAvatarPlaceholder}>👨‍⚕️</AppText>
              )}
            </View>

            <AppText style={[styles.title, styles.profileName]}>
              {laboratory.name}
            </AppText>
          </View>

          <View style={styles.profileInfoList}>
            <InfoRow label="Contact Person" value={laboratory.contact_person} />
            <InfoRow label="Phone" value={laboratory.phone} />
            <InfoRow label="Email" value={laboratory.email} />
            <InfoRow
              label="Registration Number"
              value={laboratory.registration_number}
            />
            <InfoRow
              label="Address"
              value={[
                laboratory.address,
                laboratory.city,
                laboratory.state,
                laboratory.postal_code,
                laboratory.country,
              ].filter(Boolean).join(', ')}
            />
          </View>

          <Pressable
            onPress={() =>
              router.push(`/profiles/laboratory/${laboratory.id}/edit` as never)
            }
            style={[styles.button, styles.profileEditButton]}
            accessibilityRole="button"
          >
            <AppText style={styles.buttonText}>Edit Laboratory Profile</AppText>
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
