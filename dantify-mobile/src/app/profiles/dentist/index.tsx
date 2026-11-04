import React from 'react';
import { ActivityIndicator, Alert, Image, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import dentistService from '@/services/dentist-service';
import type { Dentist } from '@/types/dentist';
import { AppText } from '@/components/ui/app-text';
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
    if (pullToRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const response = await dentistService.getMyProfile();
      setDentist(response.data ?? null);
    } catch (err: any) {
      if (err?.response?.status === 404 && err?.response?.data?.next_step === 'create_profile') {
        setDentist(null);
      } else {
        setError(err?.response?.data?.message || 'Unable to load your dentist profile.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(React.useCallback(() => {
    void loadProfile();
  }, [loadProfile]));

  const confirmDelete = () => {
    if (!dentist || deleting) return;
    Alert.alert(
      'Delete dentist profile?',
      'This will permanently delete your dentist profile. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          setDeleting(true);
          try {
            await dentistService.delete(dentist.id);
            setDentist(null);
            Alert.alert('Profile deleted', 'Your dentist profile has been deleted.');
          } catch (err: any) {
            Alert.alert('Unable to delete', err?.response?.data?.message || 'Please try again.');
          } finally {
            setDeleting(false);
          }
        } },
      ],
    );
  };

  if (loading) {
    return <View style={[styles.container, { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <AppText style={{ marginTop: 12 }}>Loading dentist profile...</AppText>
    </View>;
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40, flexGrow: 1 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadProfile(true)} tintColor={colors.primary} />}
    >
      <AppText style={styles.title}>My Dentist Profile</AppText>
      <AppText style={[styles.subtitle, { color: colors.textMuted, marginBottom: 20 }]}>Manage your professional information and profile photo.</AppText>

      {error ? <AppText variant="error" style={{ marginBottom: 16 }}>{error}</AppText> : null}

      {!dentist ? (
        <View style={{ padding: 20, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}>
          <AppText style={{ fontSize: 42, marginBottom: 12 }}>🦷</AppText>
          <AppText style={{ fontWeight: '700', marginBottom: 8 }}>No dentist profile found</AppText>
          <AppText style={{ color: colors.textMuted, textAlign: 'center', marginBottom: 18 }}>Create your professional profile to manage your dentist information.</AppText>
          <Pressable onPress={() => router.push('/profiles/dentist/create' as never)} style={styles.button}>
            <AppText style={styles.buttonText}>Create Dentist Profile</AppText>
          </Pressable>
        </View>
      ) : (
        <View style={{ padding: 20, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View style={{ width: 112, height: 112, borderRadius: 56, overflow: 'hidden', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
              {dentist.profile_photo_url ? <Image source={{ uri: dentist.profile_photo_url }} style={{ width: 112, height: 112 }} resizeMode="cover" /> : <AppText style={{ fontSize: 42 }}>👨‍⚕️</AppText>}
            </View>
            <AppText style={[styles.title, { marginTop: 12, textAlign: 'center' }]}>{dentist.name}</AppText>
            <AppText style={{ color: colors.textMuted, textAlign: 'center', marginTop: 4 }}>{dentist.specialization || 'Dental Practitioner'}</AppText>
          </View>

          <View style={{ gap: 14 }}>
            <InfoRow label="Gender" value={dentist.gender} />
            <InfoRow label="Phone" value={dentist.phone} />
            <InfoRow label="Email" value={dentist.email} />
            <InfoRow label="Address" value={[dentist.address, dentist.city, dentist.state, dentist.postal_code, dentist.country].filter(Boolean).join(', ')} />
          </View>

          <Pressable onPress={() => router.push(`/profiles/dentist/${dentist.id}/edit` as never)} style={[styles.button, { marginTop: 24 }]}>
            <AppText style={styles.buttonText}>Edit Dentist Profile</AppText>
          </Pressable>
          <Pressable onPress={confirmDelete} disabled={deleting} style={[styles.button, { marginTop: 12, backgroundColor: colors.danger, opacity: deleting ? 0.6 : 1 }]}>
            <AppText style={styles.buttonText}>{deleting ? 'Deleting...' : 'Delete Dentist Profile'}</AppText>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  const colors = useAppColors();
  if (!value) return null;
  return <View style={{ gap: 4 }}>
    <AppText style={{ color: colors.textMuted, fontSize: 12 }}>{label}</AppText>
    <AppText>{value}</AppText>
  </View>;
}
