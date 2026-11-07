import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { AppText } from '@/components/ui/app-text';
import { AppInput } from '@/components/ui/app-input';
import { StatusBadge } from '@/components/ui/status-badge';
import { useAppColors } from '@/hooks/use-app-colors';
import { useStyles } from '@/styles/styles';
import staffService from '@/services/staff-service';
import type { Staff } from '@/types/staff';

function getErrorMessage(error: unknown): string {
  const err = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } }; message?: string };
  const validationErrors = err.response?.data?.errors;
  const firstError = validationErrors ? Object.values(validationErrors)[0]?.[0] : undefined;
  return firstError ?? err.response?.data?.message ?? err.message ?? 'Something went wrong. Please try again.';
}

function extractStaffList(result: any): Staff[] {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.data?.data)) return result.data.data;
  if (Array.isArray(result?.data?.data?.data)) return result.data.data.data;
  return [];
}

export default function StaffIndexScreen() {
  const router = useRouter();
  const styles = useStyles();
  const colors = useAppColors();
  const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStaff = useCallback(async (pullToRefresh = false) => {
    if (pullToRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const result = await staffService.getAll({
        search: search.trim() || undefined,
        page: 1,
        per_page: 50,
      });
      setStaffMembers(extractStaffList(result));
    } catch (err) {
      setError(getErrorMessage(err));
      setStaffMembers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useFocusEffect(useCallback(() => {
    void loadStaff();
  }, [loadStaff]));

  useEffect(() => {
    if (loading) return;
    const timeout = setTimeout(() => void loadStaff(), 350);
    return () => clearTimeout(timeout);
  }, [search]); // Debounce only when the search text changes.

  const openProfile = (staff: Staff) => router.push({
    pathname: '/profiles/staff/[id]',
    params: { id: String(staff.id) },
  });

  const openEdit = (staff: Staff) => router.push({
    pathname: '/profiles/staff/[id]/edit',
    params: { id: String(staff.id) },
  });

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadStaff(true)} tintColor={colors.primary} />}
      >
        <View style={styles.screenHeader}>
          <View style={styles.screenHeaderContent}>
            <AppText variant="title">Our Staffs</AppText>
            <AppText variant="muted">View and manage the staff members associated with your clinic.</AppText>
          </View>
          <Pressable onPress={() => router.push('/profiles/staff/create' as never)} accessibilityRole="button" accessibilityLabel="Add staff member" style={styles.smallButton}>
            <AppText style={styles.smallButtonText}>+ Add</AppText>
          </Pressable>
        </View>

        <AppInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search staff by name, email or phone..."
          autoCapitalize="none"
          returnKeyType="search"
        />

        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={colors.primary} />
            <AppText variant="muted">Loading staff members...</AppText>
          </View>
        ) : error ? (
          <View style={styles.emptyState}>
            <AppText variant="title">Unable to load staff</AppText>
            <AppText variant="error">{error}</AppText>
            <Pressable onPress={() => void loadStaff()} accessibilityRole="button" style={[styles.actionButton, styles.replyButton]}>
              <AppText style={styles.actionButtonText}>Retry</AppText>
            </Pressable>
          </View>
        ) : staffMembers.length === 0 ? (
          <View style={styles.emptyState}>
            <AppText variant="title">{search.trim() ? 'No matching staff found' : 'No staff members yet'}</AppText>
            <AppText variant="muted">
              {search.trim() ? 'Try another search term.' : 'Add your first staff member to get started.'}
            </AppText>
            {!search.trim() && (
              <Pressable onPress={() => router.push('/profiles/staff/create' as never)} accessibilityRole="button" style={[styles.actionButton, styles.replyButton]}>
                <AppText style={styles.actionButtonText}>Add Staff Member</AppText>
              </Pressable>
            )}
          </View>
        ) : (
          <>
            <AppText variant="muted">{staffMembers.length} staff member{staffMembers.length === 1 ? '' : 's'} displayed</AppText>
            {staffMembers.map((staff) => (
              <View key={staff.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.profileAvatar}>
                    {staff.profile_photo_url ? (
                      <Image source={{ uri: staff.profile_photo_url }} style={styles.profileAvatarImage} resizeMode="cover" />
                    ) : (
                      <AppText style={styles.profileAvatarPlaceholder}>👤</AppText>
                    )}
                  </View>
                  <View style={styles.screenHeaderContent}>
                    <AppText style={styles.cardTitle}>{staff.name}</AppText>
                    {!!staff.job_title && <AppText variant="muted">{staff.job_title}</AppText>}
                    {!!staff.phone && <AppText variant="muted">{staff.phone}</AppText>}
                    {!!staff.email && <AppText variant="muted">{staff.email}</AppText>}
                  </View>
                  <StatusBadge label={staff.is_active ? 'Active' : 'Inactive'} variant={staff.is_active ? 'success' : 'danger'} />
                </View>
                <View style={styles.actionsRow}>
                  <Pressable onPress={() => openProfile(staff)} accessibilityRole="button" style={[styles.actionButton, styles.replyButton]}>
                    <AppText style={styles.actionButtonText}>View</AppText>
                  </Pressable>
                  <Pressable onPress={() => openEdit(staff)} accessibilityRole="button" style={[styles.actionButton, styles.editButton]}>
                    <AppText style={styles.actionButtonText}>Edit</AppText>
                  </Pressable>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}
