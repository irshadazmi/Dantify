import React from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppText } from '@/components/ui/app-text';
import { IconSymbol } from '@/components/icon-symbol';
import { useAuth } from '@/contexts/auth-context';
import { useAppColors } from '@/hooks/use-app-colors';

export default function PublicBookingTabBar() {
  const router = useRouter();
  const colors = useAppColors();
  const { isAuthenticated } = useAuth();

  const items = [
    {
      label: 'Home',
      icon: 'house.fill',
      onPress: () => router.replace('/' as never),
    },
    {
      label: 'Appointments',
      icon: 'calendar',
      onPress: () => router.push(
        (isAuthenticated ? '/appointments' : '/(auth)/login') as never,
      ),
    },
    {
      label: 'Login',
      icon: 'person.crop.circle',
      onPress: () => router.push(
        (isAuthenticated ? '/dashboard' : '/(auth)/login') as never,
      ),
    },
    {
      label: 'Register',
      icon: 'person.badge.plus',
      onPress: () => router.push(
        (isAuthenticated ? '/dashboard' : '/(auth)/register') as never,
      ),
    },
  ];

  return (
    <View
      style={{
        minHeight: 62,
        flexDirection: 'row',
        alignItems: 'stretch',
        backgroundColor: colors.tabBg,
        borderTopWidth: 1,
        borderTopColor: colors.tabBorderTop,
        paddingTop: 5,
        paddingBottom: 2,
      }}
    >
      {items.map((item, index) => (
        <Pressable
          key={item.label}
          onPress={item.onPress}
          accessibilityRole="button"
          accessibilityLabel={item.label}
          style={{
            flex: 1,
            minHeight: 52,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}
        >
          <IconSymbol
            name={item.icon as never}
            size={20}
            color={index === 0 ? colors.tabActive : colors.tabInactive}
          />
          <AppText
            style={{
              color: index === 0 ? colors.tabActive : colors.tabInactive,
              fontSize: 10,
              fontWeight: index === 0 ? '700' : '500',
            }}
          >
            {item.label}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}
