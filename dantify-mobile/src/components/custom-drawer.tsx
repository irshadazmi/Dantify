import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { usePathname, useRouter } from 'expo-router';

import { DRAWER_ITEMS } from '@/constants/DRAWER_ITEMS';
import { useAuth } from '@/contexts/auth-context';
import { useAppColors } from '@/hooks/use-app-colors';
import { IconSymbol } from './icon-symbol';
import { useStyles } from '@/styles/styles';

type Props = {
  onClose?: () => void;
};

function getRoleName(role: unknown): string {
  if (typeof role === 'string') {
    return role.trim().toLowerCase();
  }

  if (typeof role === 'object' && role !== null && 'name' in role) {
    const name = (role as { name?: unknown }).name;
    return typeof name === 'string' ? name.trim().toLowerCase() : '';
  }

  return '';
}

function getItemTitle(
  item: {
    name: string;
    title: string;
    roleTitles?: Record<string, string>;
  },
  role: string,
): string {
  return item.roleTitles?.[role] ?? item.title;
}


function normalizeRoute(name: string): string {
  if (name.startsWith('/')) {
    return name.length > 1 ? name.replace(/\/+$/, '') : '/';
  }

  return `/${name.replace(/[()]/g, '').replace(/^\/+|\/+$/g, '')}`;
}

const CustomDrawer: React.FC<Props> = ({ onClose }) => {
  const styles = useStyles();
  const router = useRouter();
  const pathname = usePathname();
  const colors = useAppColors();
  const { logout, user } = useAuth();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const logoutInProgress = useRef(false);

  const role = getRoleName(user?.role);

  const drawerItems = useMemo(
    () =>
      DRAWER_ITEMS
        .filter((item) =>
          item.roles.some((allowedRole) => String(allowedRole) === role)
        )
        .map((item) => ({
          ...item,
          title: getItemTitle(item, role),
        })),
    [role],
  );

  const isRouteActive = useCallback(
    (name: string): boolean => {
      if (name === 'logout' || name === 'menu' || name === '(menu)') {
        return false;
      }

      const route = normalizeRoute(name);
      return pathname === route || pathname.startsWith(`${route}/`);
    },
    [pathname],
  );

  const handleNavigate = useCallback(
    async (name: string) => {
      if (name === 'logout') {
        if (logoutInProgress.current) return;

        logoutInProgress.current = true;
        setIsLoggingOut(true);

        try {
          await logout();
          onClose?.();
          router.replace('/login');
        } catch (error) {
          console.error('[Drawer] Logout failed:', error);
        } finally {
          logoutInProgress.current = false;
          setIsLoggingOut(false);
        }

        return;
      }

      const route = normalizeRoute(name);
      onClose?.();
      router.push(route as never);
    },
    [logout, onClose, router],
  );

  return (
    <View style={styles.drawerOverlay}>
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close navigation menu"
      />

      <View
        style={[
          styles.drawerContainer,
          {
            backgroundColor: colors.surface,
            borderRightColor: colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.drawerHeader,
            {
              backgroundColor: colors.primary,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <Text
            style={[styles.drawerHeaderTitle, { color: colors.textInverse }]}
            accessibilityRole="header"
          >
            Dantify
          </Text>

          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close navigation menu"
            hitSlop={8}
            style={styles.drawerCloseButton}
          >
            <Text style={[styles.drawerCloseText, { color: colors.textInverse }]}>
              ×
            </Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.drawerItemsContainer}
          showsVerticalScrollIndicator={false}
        >
          {drawerItems.map((item) => {
            const isLogout = item.name === 'logout';
            const isActive = isRouteActive(item.name);
            const iconColor = isLogout
              ? colors.textMuted
              : isActive
                ? colors.tabActive
                : colors.textMuted;

            return (
              <Pressable
                key={item.name}
                onPress={() => void handleNavigate(item.name)}
                disabled={isLogout && isLoggingOut}
                accessibilityRole="button"
                accessibilityLabel={item.title}
                accessibilityState={{
                  selected: isActive,
                  disabled: isLogout && isLoggingOut,
                }}
                style={({ pressed }) => [
                  styles.drawerItem,
                  isActive && { backgroundColor: colors.background },
                  pressed && styles.drawerItemPressed,
                ]}
              >
                {isLogout && isLoggingOut ? (
                  <ActivityIndicator size="small" color={iconColor} />
                ) : (
                  <View style={styles.drawerIconContainer}>
                    <IconSymbol
                      name={item.icon as never}
                      size={20}
                      color={iconColor}
                    />
                  </View>
                )}

                <Text
                  numberOfLines={1}
                  style={[
                    styles.drawerItemText,
                    { color: colors.text },
                    isActive && {
                      color: colors.tabActive,
                      fontWeight: '600',
                    },
                  ]}
                >
                  {item.title}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

export default CustomDrawer;
