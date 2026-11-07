import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  View,
} from "react-native";

import {
  Slot,
  useGlobalSearchParams,
  usePathname,
  useRouter,
  useSegments,
} from "expo-router";

import { GestureHandlerRootView } from "react-native-gesture-handler";

import {
  SafeAreaProvider,
  SafeAreaView,
} from "react-native-safe-area-context";

import { AuthProvider, useAuth } from "@/contexts/auth-context";
import AppHeader from "@/components/ui/app-header";

import { TAB_ITEMS } from "@/constants/TAB_ITEMS";
import { DRAWER_ITEMS } from "@/constants/DRAWER_ITEMS";

import { ThemeProvider } from "@/contexts/theme-context";

import TabBar from "@/components/tab-bar";
import CustomDrawer from "@/components/custom-drawer";

import {
  PUBLIC_ROUTES,
  isSharedPublicRoute,
} from "@/constants/PUBLIC_ROUTES";

import {
  useStyles,
  ROOT_CONTAINER_STYLE,
} from "@/styles/styles";

/* ======================================================
   TYPES
====================================================== */

type NavigationItem = {
  name: string;
  title: string;
  roleTitles?: Partial<Record<string, string>>;
};

/* ======================================================
   HELPERS
====================================================== */

/**
 * Extract normalized role name from the authenticated user.
 *
 * Supports:
 * - "patient"
 * - { name: "patient" }
 */
function getRoleName(role: unknown): string {
  if (typeof role === "string") {
    return role.trim().toLowerCase();
  }

  if (typeof role === "object" && role !== null && "name" in role) {
    const name = (role as { name?: unknown }).name;

    return typeof name === "string"
      ? name.trim().toLowerCase()
      : "";
  }

  return "";
}

/**
 * Accept only the intended internal booking route.
 *
 * Example accepted:
 * /booking?dentistId=123
 *
 * Other paths and external URLs are rejected.
 */
function getSafeBookingRedirect(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  if (value === "/booking/availability" || value === "/booking/review") {
    return value;
  }

  return /^\/booking\?dentistId=[1-9]\d*$/.test(value)
    ? value
    : null;
}

function getBookingRouteParams(
  params: Record<string, string | string[] | undefined>,
): Record<string, string> {
  const result: Record<string, string> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (key === "redirectTo" || value === undefined) {
      return;
    }

    result[key] = Array.isArray(value) ? value[0] : value;
  });

  return result;
}

/**
 * Normalize Expo Router navigation paths.
 */
function normalizeRoute(name: string): string {
  if (name.startsWith("/")) {
    return name.length > 1
      ? name.replace(/\/+$/, "")
      : "/";
  }

  return `/${name
    .replace(/[()]/g, "")
    .replace(/^\/+|\/+$/g, "")}`;
}

/**
 * Resolve header title from tab and drawer configurations.
 */
function getRouteTitle(
  pathname: string,
  role: string,
): string {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";

  const items: NavigationItem[] = [
    ...TAB_ITEMS,
    ...DRAWER_ITEMS,
  ];

  const matchingItem = items
    .filter((item) => {
      if (
        item.name === "logout" ||
        item.name === "menu" ||
        item.name === "(menu)"
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
        normalizeRoute(b.name).length -
        normalizeRoute(a.name).length,
    )[0];

  if (matchingItem) {
    const roleTitle = matchingItem.roleTitles?.[role];

    return (roleTitle ?? matchingItem.title).toUpperCase();
  }

  const segment = normalizedPath
    .split("/")
    .filter(Boolean)
    .pop();

  if (!segment) {
    return "DANTIFY";
  }

  const knownTitles: Record<string, string> = {
    dashboard: "DASHBOARD",
    create: "CREATE",
    edit: "EDIT",
    settings: "SETTINGS",
    help: "HELP",
    about: "ABOUT",
    login: "LOGIN",
    register: "REGISTER",
    "forgot-password": "FORGOT PASSWORD",
    "reset-password": "RESET PASSWORD",
    "treatment-plans": "TREATMENT PLANS",
    "lab-orders": "LAB ORDERS",
  };

  return (
    knownTitles[segment] ??
    segment.replace(/[-_]/g, " ").toUpperCase()
  );
}

/* ======================================================
   APP SHELL
====================================================== */

function AppShell() {
  const styles = useStyles();

  const {
    isLoading,
    isAuthenticated,
    user,
    postAuthRoute,
  } = useAuth();

  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();

  const params = useGlobalSearchParams<
    Record<string, string | string[]>
  >();

  const redirectParam = Array.isArray(params.redirectTo)
    ? params.redirectTo[0]
    : params.redirectTo;

  const redirectTo = getSafeBookingRedirect(redirectParam);

  const [drawerOpen, setDrawerOpen] = useState(false);

  /* ----------------------------------------------------
     ROUTE CLASSIFICATION
  ---------------------------------------------------- */

  const isAuthRoute = segments[0] === "(auth)";

  const isLandingPath = pathname === "/";

  const isPublicPath = PUBLIC_ROUTES.some(
    (path) =>
      pathname === path ||
      (path !== "/" && pathname.startsWith(`${path}/`)),
  );

  const isSharedBookingPath = isSharedPublicRoute(pathname);
  const bookingParams = getBookingRouteParams(params);

  /**
   * Public-facing experience:
   * - Landing page
   * - Dentist and clinic discovery
   * - Public booking screens
   *
   * Accessible to guests and authenticated users.
   */
  const isPublicExperiencePath = isLandingPath;

  const role = getRoleName(user?.role);

  const headerTitle = useMemo(
    () => getRouteTitle(pathname, role),
    [pathname, role],
  );

  /* ----------------------------------------------------
     AUTHENTICATION ROUTING
  ---------------------------------------------------- */

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      if (
        !isAuthRoute &&
        !isPublicPath &&
        !isSharedBookingPath
      ) {
        router.replace("/splash");
      }

      return;
    }

    /**
     * Authenticated users should not remain on login,
     * registration, or other guest-only authentication
     * screens.
     *
     * When a patient was redirected here from booking,
     * return them to that booking route after login.
     */
    if (
      isAuthRoute ||
      (
        isPublicPath &&
        !isSharedBookingPath &&
        !isLandingPath
      )
    ) {
      const bookingRedirect =
        role === "patient" ? redirectTo : null;

      if (bookingRedirect === "/booking/availability" || bookingRedirect === "/booking/review") {
        router.replace({
          pathname: bookingRedirect,
          params: bookingParams,
        } as never);
      } else {
        router.replace(
          (
            bookingRedirect ??
            postAuthRoute ??
            "/dashboard"
          ) as never,
        );
      }
    }
  }, [
    isLoading,
    isAuthenticated,
    isAuthRoute,
    isPublicPath,
    isSharedBookingPath,
    isLandingPath,
    role,
    redirectTo,
    postAuthRoute,
    router,
  ]);

  /* ----------------------------------------------------
     CLOSE DRAWER WHEN ROUTE CHANGES
  ---------------------------------------------------- */

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  /* ----------------------------------------------------
     LOADING STATE
  ---------------------------------------------------- */

  if (isLoading) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={["top", "bottom"]}
      >
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={styles.welcome.color}
          />
        </View>
      </SafeAreaView>
    );
  }

  /* ----------------------------------------------------
     GUEST ACCESS
  ---------------------------------------------------- */

  if (!isAuthenticated) {
    if (
      !isAuthRoute &&
      !isPublicPath &&
      !isSharedBookingPath
    ) {
      return (
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.center}>
            <ActivityIndicator
              size="large"
              color={styles.welcome.color}
            />
          </View>
        </SafeAreaView>
      );
    }

    /**
     * Guests use their own public screens and navigation.
     */
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={["top", "bottom"]}
      >
        <Slot />
      </SafeAreaView>
    );
  }

  /* ----------------------------------------------------
     AUTHENTICATED USER REDIRECTION
  ---------------------------------------------------- */

  if (
    isAuthRoute ||
    (
      isPublicPath &&
      !isSharedBookingPath &&
      !isLandingPath
    )
  ) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={styles.welcome.color}
          />
        </View>
      </SafeAreaView>
    );
  }

  /* ----------------------------------------------------
     PUBLIC EXPERIENCE FOR AUTHENTICATED USERS
  ---------------------------------------------------- */

  if (isPublicExperiencePath) {
    /**
     * Do not render AppHeader, authenticated TabBar,
     * or CustomDrawer here.
     *
     * Public landing and booking screens provide
     * their own navigation.
     */
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={["top", "bottom"]}
      >
        <Slot />
      </SafeAreaView>
    );
  }

  /* ----------------------------------------------------
     AUTHENTICATED APPLICATION
  ---------------------------------------------------- */

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "bottom"]}
    >
      <View style={styles.appContainer}>
        <AppHeader title={headerTitle} />

        <View style={styles.content}>
          <Slot />
        </View>

        <TabBar
          onMenuPress={() => setDrawerOpen(true)}
        />

        {drawerOpen && (
          <CustomDrawer
            onClose={() => setDrawerOpen(false)}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

/* ======================================================
   ROOT LAYOUT
====================================================== */

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={ROOT_CONTAINER_STYLE}>
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