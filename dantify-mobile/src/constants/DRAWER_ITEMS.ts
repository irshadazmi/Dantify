
import { ROLES, type RoleType } from './CONSTANTS';

export type DrawerItem = {
  name: string;
  title: string;
  icon: string;
  roles: readonly RoleType[];
  roleTitles?: Partial<Record<RoleType, string>>;
  roleRoutes?: Partial<Record<RoleType, string>>;
};

const ALL_ROLES: readonly RoleType[] = Object.values(ROLES);

export const DRAWER_ITEMS = [
  {
    name: '/dashboard',
    title: 'Home',
    icon: 'house.fill',
    roles: ALL_ROLES,
  },
  {
    name: '/clinics',
    title: 'Clinics',
    icon: 'building.2.fill',
    roles: [ROLES.SUPER_ADMIN, ROLES.CLINIC],
  },
  {
    name: '/dentists',
    title: 'Dentists',
    icon: 'person.3.fill',
    roles: [ROLES.SUPER_ADMIN, ROLES.CLINIC, ROLES.STAFF],
  },
  {
    name: '/services',
    title: 'Services',
    icon: 'dentistry',
    roles: [
      ROLES.SUPER_ADMIN,
    ],
  },
  {
    name: '/dental-services',
    title: 'Our Services',
    icon: 'dentistry',
    roles: [
      ROLES.CLINIC,
    ],
  },
  {
    name: '/associations',
    title: 'Associations',
    roleTitles: {
      [ROLES.DENTIST]: 'My Clinics',
      [ROLES.CLINIC]: 'Our Dentists',
    },
    icon: 'person.2.fill',
    roles: [ROLES.CLINIC, ROLES.DENTIST],
  },
  {
    name: '/patients',
    title: 'Patients',
    icon: 'person.fill',
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.CLINIC,
      ROLES.DENTIST,
      ROLES.STAFF,
    ],
  },
  {
    name: '/appointments',
    title: 'Appointments',
    icon: 'calendar.badge.clock',
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.CLINIC,
      ROLES.DENTIST,
      ROLES.STAFF,
      ROLES.PATIENT,
    ],
  },
  {
    name: '/billings',
    title: 'Billing',
    icon: 'wallet.pass.fill',
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.CLINIC,
      ROLES.STAFF,
    ],
  },
  {
    name: '/insights',
    title: 'Insights',
    icon: 'chart.bar.fill',
    roles: [
      ROLES.SUPER_ADMIN,
      ROLES.CLINIC,
      ROLES.DENTIST,
    ],
  },
  {
    name: '/feedback',
    title: 'Feedback',
    icon: 'envelope.badge.fill',
    roles: ALL_ROLES,
  },
  {
    name: '/help',
    title: 'Help',
    icon: 'questionmark.circle.fill',
    roles: ALL_ROLES,
  },
  {
    name: '/settings',
    title: 'Settings',
    icon: 'gearshape.fill',
    roles: ALL_ROLES,
  },
  {
    name: '/about',
    title: 'About',
    icon: 'info.circle',
    roles: ALL_ROLES,
  },
  {
    name: 'logout',
    title: 'Log out',
    icon: 'rectangle.portrait.and.arrow.right',
    roles: ALL_ROLES,
  },
] as const satisfies readonly DrawerItem[];
