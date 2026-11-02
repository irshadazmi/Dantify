import React, { useCallback, useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { usePathname, useRouter } from 'expo-router';

import { TAB_ITEMS } from '@/constants/TAB_ITEMS';
import { useAuth } from '@/contexts/auth-context';
import { useAppColors } from '@/hooks/use-app-colors';
import { IconSymbol } from './icon-symbol';
import { useStyles } from "@/styles/styles";

type Props = {
  onMenuPress?: () => void;
};

type TabBarItem = {
  name: string;
  title: string;
  icon: string;
  roles: readonly string[];
  roleTitles?: Record<string, string>;
  badgeCount?: number;
  type?: 'menu';
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
  item: TabBarItem,
  role: string,
): string {
  return item.roleTitles?.[role] ?? item.title;
}

const isMenuItem = (item: TabBarItem): boolean =>
  item.type === 'menu' ||
  item.name === 'menu' ||
  item.name === '(menu)';

function normalizeRoute(name: string): string {
  if (name.startsWith('/')) {
    return name.length > 1 ? name.replace(/\/+$/, '') : '/';
  }

  return `/${name.replace(/[()]/g, '').replace(/^\/+|\/+$/g, '')}`;
}

const TabBar: React.FC<Props> = ({ onMenuPress }) => {
  const styles = useStyles();
  const router = useRouter();
  const pathname = usePathname();
  const colors = useAppColors();
  const { user } = useAuth();

  const role = getRoleName(user?.role);

  const items = useMemo(
    () =>
      (TAB_ITEMS as readonly TabBarItem[])
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
      if (name === 'menu' || name === '(menu)' || !name) {
        return false;
      }

      const route = normalizeRoute(name);
      return pathname === route || pathname.startsWith(`${route}/`);
    },
    [pathname],
  );

  const handlePress = useCallback(
    (item: TabBarItem) => {
      if (isMenuItem(item)) {
        onMenuPress?.();
        return;
      }

      const route = normalizeRoute(item.name);
      if (!isRouteActive(route)) {
        router.push(route as never);
      }
    },
    [isRouteActive, onMenuPress, router],
  );

  return (
    <View style={styles.tabBarContainer}>
      {items.map((item) => {
        const isMenu = isMenuItem(item);
        const isActive = !isMenu && isRouteActive(item.name);
        const badgeCount = Math.max(0, item.badgeCount ?? 0);
        const color = isActive ? colors.tabActive : colors.tabInactive;

        return (
          <Pressable
            key={item.name}
            style={({ pressed }) => [
              styles.tabBarItem,
              pressed && styles.tabBarPressed,
            ]}
            onPress={() => handlePress(item)}
            accessibilityRole="button"
            accessibilityLabel={
              badgeCount > 0 && !isMenu
                ? `${item.title}, ${badgeCount} notifications`
                : item.title
            }
            accessibilityState={{ selected: isActive }}
            hitSlop={4}
          >
            <View style={styles.tabBarIconWrapper}>
              <IconSymbol
                name={item.icon as never}
                size={22}
                color={color}
              />

              {badgeCount > 0 && !isMenu && (
                <View
                  style={[
                    styles.tabBarBadge,
                    { backgroundColor: colors.badgeBg },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabBarBadgeText,
                      { color: colors.badgeText },
                    ]}
                  >
                    {badgeCount > 9 ? "9+" : badgeCount}
                  </Text>
                </View>
              )}
            </View>

            <Text
              numberOfLines={1}
              style={[
                styles.tabBarLabel,
                {
                  color,
                  fontWeight: isActive ? "600" : "400",
                },
              ]}
            >
              {item.title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

export default TabBar;
