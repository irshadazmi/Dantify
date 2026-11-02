import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useAuth } from '@/contexts/auth-context';
import { useAppColors } from '@/hooks/use-app-colors';
import { useStyles } from '@/styles/styles';
import { AppText } from "@/components/ui/app-text";

type RoleValue = string | { name?: string } | null | undefined;

function normalizeRole(role: RoleValue): string {
  const value = typeof role === 'string' ? role : role?.name ?? '';
  return value.trim().toLowerCase().replace(/[\s_-]+/g, '');
}

export default function Index() {
  const styles = useStyles();
  const colors = useAppColors();
  const router = useRouter();
  const { user } = useAuth();

  const role = normalizeRole((user as { role?: RoleValue } | null)?.role);
  const isClinic = role === 'clinic' || role === 'admin' || role === 'administrator';
  const isDentist = role === 'dentist';
  const canManageAssociations = isClinic || isDentist;

  const openRoute = (
    route: '/associations/clinic-dentist' | '/associations/dentist-clinic' | '/associations/requests',
  ) => router.push(route as never);

  const ActionCard = ({
    title,
    description,
    buttonLabel,
    onPress,
  }: {
    title: string;
    description: string;
    buttonLabel: string;
    onPress: () => void;
  }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <AppText style={styles.cardTitle}>{title}</AppText>
      <AppText style={[styles.settingsDescription, { color: colors.textSecondary }]}>
        {description}
      </AppText>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={[styles.smallButton, { backgroundColor: colors.primary }]}
      >
        <AppText style={[styles.smallButtonText, { color: colors.badgeText }]}>
          {buttonLabel}
        </AppText>
      </Pressable>
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.contentContainer}>
      <View style={styles.dashboardHeaderContainer}>
        <View style={styles.dashboardBadgeContainer}>
          <AppText style={styles.dashboardBadgeText}>DANTIFY</AppText>
        </View>
        <AppText style={styles.welcome}>
          {isClinic ? 'Welcome, Clinic' : isDentist ? 'Welcome, Dentist' : 'Welcome to Dantify'}
        </AppText>
        <AppText style={styles.description}>
          {isClinic
            ? 'Connect your clinic with dentists and manage association requests.'
            : isDentist
              ? 'Discover clinics, request associations, and manage invitations.'
              : 'Your dental practice management workspace.'}
        </AppText>
      </View>

      {canManageAssociations ? (
        <View style={styles.dashboardSection}>
          <AppText style={styles.dashboardChartTitle}>Associations</AppText>

          {isClinic ? (
            <ActionCard
              title="Find Dentists"
              description="Browse dentist profiles and invite a dentist to associate with your clinic."
              buttonLabel="Discover Dentists"
              onPress={() => openRoute('/associations/clinic-dentist')}
            />
          ) : null}

          {isDentist ? (
            <ActionCard
              title="Find Clinics"
              description="Browse active clinics and request an association with a clinic."
              buttonLabel="Discover Clinics"
              onPress={() => openRoute('/associations/dentist-clinic')}
            />
          ) : null}

          <ActionCard
            title="Association Requests"
            description="Review invitations and accept or decline pending requests."
            buttonLabel="View Requests"
            onPress={() => openRoute('/associations/requests')}
          />
        </View>
      ) : (
        <View style={styles.dashboardSection}>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <AppText style={styles.cardTitle}>Quick start</AppText>
            <AppText style={[styles.text, { color: colors.textSecondary }]}>
              Use the navigation menu to open the features available for your account.
            </AppText>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
