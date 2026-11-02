/* Public routes available without an authenticated session. */

export const PUBLIC_ROUTES = [
  '/',
  '/splash',
  '/intro',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
] as const;

/**
 * Shared discovery and booking routes are accessible to both guests and
 * authenticated patients. They must not trigger the post-login dashboard
 * redirect in AppShell.
 */
export const SHARED_PUBLIC_ROUTES = ['/booking'] as const;

export type PublicRoute = (typeof PUBLIC_ROUTES)[number];

export const isPublicRoute = (pathname: string): boolean =>
  (PUBLIC_ROUTES as readonly string[]).includes(pathname);

export const isSharedPublicRoute = (pathname: string): boolean =>
  (SHARED_PUBLIC_ROUTES as readonly string[]).some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
