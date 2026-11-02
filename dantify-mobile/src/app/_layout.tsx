/* src/app/_layout.tsx */
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import {
  Slot,
  usePathname,
  useRouter,
  useSegments,
} from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/contexts/auth-context';
import AppHeader from '@/components/ui/app-header';
import { TAB_ITEMS } from '@/constants/TAB_ITEMS';
import { DRAWER_ITEMS } from '@/constants/DRAWER_ITEMS';
import { ThemeProvider } from '@/contexts/theme-context';
import { useAppColors } from '@/hooks/use-app-colors';
import TabBar from '@/components/tab-bar';
import CustomDrawer from '@/components/custom-drawer';
import { PUBLIC_ROUTES, isSharedPublicRoute } from '@/constants/PUBLIC_ROUTES';

type NavigationItem = {
  name: string;
  title: string;
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

function normalizeRoute(name: string): string {
  if (name.startsWith('/')) {
    return name.length > 1 ? name.replace(/\/+$/, '') : '/';
  }

  return `/${name.replace(/[()]/g, '').replace(/^\/+|\/+$/g, '')}`;
}

function getRouteTitle(pathname: string, role: string): string {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  const items: NavigationItem[] = [...TAB_ITEMS, ...DRAWER_ITEMS];

  const matchingItem = items
    .filter((item) => {
      if (
        item.name === 'logout' ||
        item.name === 'menu' ||
        item.name === '(menu)'
      ) {
        return false;
      }

      const itemPath = normalizeRoute(item.name);

      return (
        normalizedPath === itemPath ||
        normalizedPath.startsWith(`${itemPath}/`)
      );
    })
    .sort(
      (a, b) =>
        normalizeRoute(b.name).length - normalizeRoute(a.name).length,
    )[0];

  if (matchingItem) {
    if (matchingItem.name === '/associations') {
      if (role === 'dentist') return 'MY CLINICS';
      if (role === 'clinic') return 'OUR DENTISTS';
    }

    return matchingItem.title.toUpperCase();
  }

  const segment = normalizedPath.split('/').filter(Boolean).pop();

  if (!segment) return 'DANTIFY';

  const knownTitles: Record<string, string> = {
    dashboard: 'DASHBOARD',
    create: 'CREATE',
    edit: 'EDIT',
    settings: 'SETTINGS',
    help: 'HELP',
    about: 'ABOUT',
    login: 'LOGIN',
    register: 'REGISTER',
    'forgot-password': 'FORGOT PASSWORD',
    'reset-password': 'RESET PASSWORD',
    'treatment-plans': 'TREATMENT PLANS',
    'lab-orders': 'LAB ORDERS',
  };

  return (
    knownTitles[segment] ??
    segment.replace(/[-_]/g, ' ').toUpperCase()
  );
}

function AppShell() {
  const COLORS = useAppColors();
  const {
    isLoading,
    isAuthenticated,
    user,
    postAuthRoute,
  } = useAuth();

  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();

  const [drawerOpen, setDrawerOpen] = useState(false);

  const isAuthRoute = segments[0] === '(auth)';

  const isPublicPath = PUBLIC_ROUTES.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  const isSharedBookingPath = isSharedPublicRoute(pathname);

  const role = getRoleName(user?.role);

  const headerTitle = useMemo(
    () => getRouteTitle(pathname, role),
    [pathname, role],
  );

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      if (!isAuthRoute && !isPublicPath && !isSharedBookingPath) {
        router.replace('/splash');
      }
      return;
    }

    if (isAuthRoute || (isPublicPath && !isSharedBookingPath)) {
      router.replace((postAuthRoute ?? '/dashboard') as never);
    }
  }, [
    isLoading,
    isAuthenticated,
    isAuthRoute,
    isPublicPath,
    isSharedBookingPath,
    postAuthRoute,
    router,
  ]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: COLORS.background }]}
        edges={['top', 'bottom']}
      >
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    if (!isAuthRoute && !isPublicPath && !isSharedBookingPath) {
      return (
        <SafeAreaView
          style={[styles.safeArea, { backgroundColor: COLORS.background }]}
        >
          <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: COLORS.background }]}
        edges={['top', 'bottom']}
      >
        <Slot />
      </SafeAreaView>
    );
  }

  if (isAuthRoute || (isPublicPath && !isSharedBookingPath)) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: COLORS.background }]}
      >
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: COLORS.background }]}
      edges={['top', 'bottom']}
    >
      <View style={styles.appContainer}>
        <AppHeader title={headerTitle} />

        <View style={styles.content}>
          <Slot />
        </View>

        <TabBar onMenuPress={() => setDrawerOpen(true)} />

        {drawerOpen && (
          <CustomDrawer onClose={() => setDrawerOpen(false)} />
        )}
      </View>
    </SafeAreaView>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AuthProvider>
          <ThemeProvider>
            <AppShell />
          </ThemeProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  appContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
