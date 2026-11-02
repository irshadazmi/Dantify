/* src/constants/navigation-utils.ts */

import { ROLES, RoleType } from "@/constants/CONSTANTS";


/**
 * Supports both API role representations:
 *   role: "clinic"
 *   role: { name: "clinic" }
 *
 * Returns the canonical value from ROLES so navigation checks
 * use the same values as TAB_ITEMS and DRAWER_ITEMS.
 */
export function getNavigationRole(role: unknown): RoleType | null {
  const roleName =
    typeof role === 'string'
      ? role
      : typeof role === 'object' && role !== null && 'name' in role
        ? (role as { name?: unknown }).name
        : null;

  if (typeof roleName !== 'string' || !roleName.trim()) {
    return null;
  }

  const normalizedName = roleName.trim().toLowerCase();

  return (
    (Object.values(ROLES) as RoleType[]).find(
      (value) => String(value).toLowerCase() === normalizedName,
    ) ?? null
  );
}
