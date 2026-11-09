import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,

  FlatList,
  Pressable,
  RefreshControl,
  TextInput,
  View
} from 'react-native';

import { showAppDialog } from "@/components/ui/app-dialog";
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from "@/components/ui/app-text";
import { useAppColors } from '@/hooks/use-app-colors';
import { useStyles } from '@/styles/styles';
import api from '@/config/api';
import associationDiscoveryService, { type DiscoverableClinic } from '@/services/association-discovery-service';
import clinicDentistInviteService from '@/services/clinic-dentist-invite-service';

type Candidate = DiscoverableClinic;

function getErrorMessage(error: any): string {
  return error?.response?.data?.message ?? error?.message ?? 'Something went wrong. Please try again.';
}

export default function DentistClinicScreen() {
  const styles = useStyles();
  const colors = useAppColors();
  const router = useRouter();
  const [items, setItems] = useState<Candidate[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [shortQuery, setShortQuery] = useState(false);
  const requestId = useRef(0);
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [profileId, setProfileId] = useState<number | null>(null);
  const [profileError, setProfileError] = useState('');

  const loadItems = useCallback(async (searchTerm = '', isRefresh = false) => {
    const currentRequestId = ++requestId.current;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setSearching(searchTerm.trim().length >= 3);
    setProfileError('');

    try {
      const profileResponse = await api.get<{
        data?: { id?: number } | null;
        message?: string;
      }>('/my/dentist-profile');

      if (currentRequestId !== requestId.current) return;

      const id = profileResponse.data?.data?.id;
      if (!id) {
        setProfileId(null);
        setProfileError('Your profile is incomplete. Complete it before sending association requests.');
        setItems([]);
        return;
      }

      setProfileId(id);
      const term = searchTerm.trim();
      const result = await associationDiscoveryService.discoverClinics({
        ...(term.length >= 3 ? { query: term, search_all: true } : {}),
        page: 1,
      });

      if (currentRequestId !== requestId.current) return;
      setItems(result.data.data);
    } catch (error: any) {
      if (currentRequestId !== requestId.current) return;
      const message = getErrorMessage(error);
      setItems([]);
      if (error?.response?.status === 404) setProfileError(message);
      else showAppDialog('Unable to load', message);
    } finally {
      if (currentRequestId === requestId.current) {
        setLoading(false);
        setRefreshing(false);
        setSearching(false);
      }
    }
  }, []);

  useEffect(() => {
    const term = query.trim();

    if (term.length > 0 && term.length < 3) {
      requestId.current += 1;
      setItems([]);
      setLoading(false);
      setSearching(false);
      setShortQuery(true);
      return;
    }

    setShortQuery(false);
    const timer = setTimeout(() => {
      void loadItems(term);
    }, term.length === 0 ? 0 : 350);

    return () => clearTimeout(timer);
  }, [query, loadItems]);

  const sendInvite = async (item: Candidate) => {
    if (!profileId) {
      showAppDialog('Profile required', 'Complete your profile before sending an association request.');
      return;
    }

    setSendingId(item.id);
    try {
      await clinicDentistInviteService.inviteClinic(profileId, { clinic_id: item.id });
      showAppDialog('Request sent', 'Your association request has been sent.');
      await loadItems(query.trim(), true);
    } catch (error: any) {
      showAppDialog('Request not sent', getErrorMessage(error));
      await loadItems(query.trim(), true);
    } finally {
      setSendingId(null);
    }
  };

  const statusLabel = (item: Candidate) => {
    if (item.is_associated) return 'Already associated';
    if (item.invite_status === 'pending') return 'Request pending';
    if (item.invite_status === 'accepted') return 'Accepted — schedule setup required';
    if (item.invite_status === 'declined') return 'Previously declined — you may retry';
    return null;
  };

  const canInvite = (item: Candidate) =>
    !item.is_associated && item.invite_status !== 'pending' && item.invite_status !== 'accepted';

  const renderItem = ({ item }: { item: Candidate }) => {
    const disabled = !canInvite(item) || sendingId === item.id;

    return (
      <View style={styles.card}>
        <AppText style={styles.cardTitle}>{item.name}</AppText>
        {[item.address, item.city, item.state, item.country].filter(Boolean).length ? (
          <AppText style={styles.text}>
            {[item.address, item.city, item.state, item.country].filter(Boolean).join(', ')}
          </AppText>
        ) : null}
        {statusLabel(item) ? (
          <AppText style={styles.metaText}>{statusLabel(item)}</AppText>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled, busy: sendingId === item.id }}
          onPress={() => void sendInvite(item)}
          disabled={disabled}
          style={[
            styles.button,
            { marginTop: 10, marginBottom: 0, opacity: disabled ? 0.65 : 1 },
          ]}
        >
          {sendingId === item.id ? (
            <ActivityIndicator color={colors.badgeText} />
          ) : (
            <AppText style={styles.buttonText}>
              {item.is_associated ? 'Already associated'
                : item.invite_status === 'pending' ? 'Request pending'
                : item.invite_status === 'accepted' ? 'Accepted'
                : item.invite_status === 'declined' ? 'Request again'
                : 'Request association'}
            </AppText>
          )}
        </Pressable>
      </View>
    );
  };


  return (
    <View style={[styles.container, { flex: 1 }]}>
      <Stack.Screen
        options={{
          title: 'Find Clinics',
          headerLeft: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to association requests"
              onPress={() => router.replace('/associations/requests' as never)}
              hitSlop={10}
              style={{ paddingRight: 12, paddingVertical: 6 }}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </Pressable>
          ),
        }}
      />

      <AppText style={styles.title}>Find Clinics</AppText>
      <AppText style={styles.description}>Discover active clinics and request an association with a clinic.</AppText>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <View style={{ flex: 1 }}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by clinic name or location"
            placeholderTextColor={colors.textMuted}
            returnKeyType="search"
            autoCorrect={false}
            accessibilityLabel="Search by clinic name or location"
            style={[styles.textInput, { marginBottom: 0, paddingRight: 42 }]}
          />
        </View>
        {query.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            onPress={() => setQuery('')}
            hitSlop={8}
            style={{ position: 'absolute', right: 10, padding: 6 }}
          >
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      {shortQuery ? (
        <AppText style={styles.mutedText}>Enter at least 3 characters to search.</AppText>
      ) : searching ? (
        <AppText style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 8 }}>
          Searching…
        </AppText>
      ) : null}

      {profileError ? (
        <View style={styles.card}>
          <AppText style={styles.errorText}>{profileError}</AppText>
        </View>
      ) : loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText style={{ color: colors.textSecondary, marginTop: 10 }}>Loading…</AppText>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void loadItems(query.trim(), true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <AppText style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 24 }}>
              {shortQuery
                ? 'Keep typing to search.'
                : query.trim()
                  ? 'No results found. Try a different search.'
                  : 'No results found.'}
            </AppText>
          }
          contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
        />
      )}
    </View>
  );
}
