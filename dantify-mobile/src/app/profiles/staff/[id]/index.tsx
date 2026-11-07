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

import staffService from '@/services/staff-service';
import type { Staff } from '@/types/staff';
import { AppText } from '@/components/ui/app-text';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useAppColors } from '@/hooks/use-app-colors';
import { useStyles } from '@/styles/styles';

export default function StaffProfileIndex() {
  const styles = useStyles();
  const colors = useAppColors();
  const router = useRouter();

  const [staff, setStaff] = React.useState<Staff | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadProfile = React.useCallback(async (pullToRefresh = false) => {
    if (pullToRefresh) setRefreshing(true);
    else setLoading(true);

    setError(null);

    try {
      const response = await staffService.getMyProfile();
      setStaff(response.data ?? null);
    } catch (err: any) {
      if (
        err?.response?.status === 404 &&
        err?.response?.data?.next_step === 'create_profile'
      ) {
        setStaff(null);
      } else {
        setError(
          err?.response?.data?.message ||
            'Unable to load your staff profile.',
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
        <AppText>Loading staff profile...</AppText>
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
        title="My Staff Profile"
        subtitle="Manage your professional information and profile photo."
      />

      {error ? (
        <AppText variant="error" style={styles.profileError}>
          {error}
        </AppText>
      ) : null}

      {!staff ? (
        <View style={styles.profileEmptyCard}>
          <AppText style={styles.profileEmptyIcon}>🦷</AppText>
          <AppText style={styles.profileEmptyTitle}>
            No staff profile found
          </AppText>
          <AppText style={styles.profileEmptyDescription}>
            Create your professional profile to manage your staff information.
          </AppText>
          <Pressable
            onPress={() => router.push('/profiles/staff/create' as never)}
            style={styles.button}
            accessibilityRole="button"
          >
            <AppText style={styles.buttonText}>Create Staff Profile</AppText>
          </Pressable>
        </View>
      ) : (
        <View style={styles.profileCard}>
          <View style={styles.profileAvatarSection}>
            <View style={styles.profileAvatar}>
              {staff.profile_photo_url ? (
                <Image
                  source={{ uri: staff.profile_photo_url }}
                  style={styles.profileAvatarImage}
                  resizeMode="cover"
                />
              ) : (
                <AppText style={styles.profileAvatarPlaceholder}>👨‍⚕️</AppText>
              )}
            </View>

            <AppText style={[styles.title, styles.profileName]}>
              {staff.name}
            </AppText>
          </View>

          <View style={styles.profileInfoList}>
            <InfoRow label="Gender" value={staff.gender} />
            <InfoRow label="Phone" value={staff.phone} />
            <InfoRow label="Email" value={staff.email} />
            <InfoRow
              label="Address"
              value={[
                staff.address,
                staff.city,
                staff.state,
                staff.postal_code,
                staff.country,
              ].filter(Boolean).join(', ')}
            />
          </View>

          <Pressable
            onPress={() =>
              router.push(`/profiles/staff/${staff.id}/edit` as never)
            }
            style={[styles.button, styles.profileEditButton]}
            accessibilityRole="button"
          >
            <AppText style={styles.buttonText}>Edit Staff Profile</AppText>
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
