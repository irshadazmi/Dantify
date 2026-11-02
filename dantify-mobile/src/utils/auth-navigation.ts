import type { AuthUser } from '@/types/auth';

const PROFILE_ROUTES: Record<string, string> = {
  patient: '/profiles/patient/create',
  dentist: '/profiles/dentist/create',
  clinic: '/profiles/clinic/create',
  staff: '/profiles/staff/create',
  laboratory: '/profiles/laboratory/create',
};

export function getPostAuthRoute(
  user: AuthUser,
  nextStep?: string | null,
): string {
  if (
    nextStep === 'create_profile' ||
    nextStep === 'complete_profile'
  ) {
    const roleName =
      typeof user.role === 'string'
        ? user.role.toLowerCase()
        : user.role.name.toLowerCase();

    return PROFILE_ROUTES[roleName] ?? '/dashboard';
  }

  return '/dashboard';
}