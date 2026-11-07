
import { ROLES, type RoleType } from './CONSTANTS';

export type TabItem = {
  name: string;
  title: string;
  icon: string;
  roles: readonly string[];
  roleTitles?: Partial<Record<RoleType, string>>;
  badgeCount?: number;
  type?: 'menu';
};

const ALL_ROLES: readonly RoleType[] = Object.values(ROLES);

export const TAB_ITEMS = [
  {
    name: '/dashboard',
    title: 'Home',
    icon: 'house.fill',
    roles: ALL_ROLES,
  },
  {
    name: '/appointments',
    title: 'Appointments',
    icon: 'calendar.badge.clock',
    roles: [
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
    roles: [ROLES.PATIENT],
  },
  {
    name: '/insights',
    title: 'Insights',
    icon: 'chart.bar.fill',
    roles: [ROLES.CLINIC, ROLES.DENTIST],
  },
  {
    name: '/dental-services',
    title: 'Services',
    icon: 'dentistry',
    roles: [
      ROLES.SUPER_ADMIN,
    ],
  },
  {
    name: '/medicines',
    title: 'Medicines',
    icon: 'pills.fill',
    roles: [ROLES.SUPER_ADMIN],
  },
  {
    name: '/dental-advices',
    title: 'Dental Advice',
    icon: 'list.clipboard.fill',
    roles: [ROLES.SUPER_ADMIN],
  },
  {
    name: '/profiles/clinic',
    title: 'Our Profile',
    icon: 'person.crop.circle.fill',
    roles: [ROLES.CLINIC],
  },
  {
    name: '/profiles/dentist',
    title: 'My Profile',
    icon: 'person.crop.circle.fill',
    roles: [ROLES.DENTIST],
  },
  {
    name: '/profiles/staff',
    title: 'My Profile',
    icon: 'person.crop.circle.fill',
    roles: [ROLES.STAFF],
  },
  {
    name: '/profiles/laboratory',
    title: 'Our Profile',
    icon: 'person.crop.circle.fill',
    roles: [ROLES.LABORATORY],
  },
  {
    name: '/profiles/patient',
    title: 'My Profile',
    icon: 'person.crop.circle.fill',
    roles: [ROLES.PATIENT],
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
    name: 'menu',
    title: 'Menu',
    icon: 'line.3.horizontal',
    roles: ALL_ROLES,
    type: 'menu',
  },
] as const satisfies readonly TabItem[];
