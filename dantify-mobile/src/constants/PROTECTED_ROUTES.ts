
/* src/constants/PROTECTED_ROUTES.ts */

export const PROTECTED_ROUTES = [
  '/',
  '/dashboard',
  '/clinics',
  '/dentists',
  '/patients',
  '/appointments',
  '/payments',
  '/ai',
  '/insights',
  '/feedback',
  '/settings',
  '/help',
  '/about',
] as const;

export type ProtectedRoute = (typeof PROTECTED_ROUTES)[number];

export const isProtectedRoute = (pathname: string): boolean =>
  (PROTECTED_ROUTES as readonly string[]).includes(pathname);
