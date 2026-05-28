/**
 * Roles with team-wide mobile access:
 * - owner: first registered dashboard user
 * - admin, manager: invited schedule managers
 */
export const MOBILE_MANAGER_ROLES = ['owner', 'admin', 'manager'] as const;

export type MobileViewMode = 'provider' | 'team';

export function isMobileManagerRole(role?: string | null): boolean {
  return !!role && (MOBILE_MANAGER_ROLES as readonly string[]).includes(role);
}

export function canAccessProviderApp(
  employee: { id: string; name: string } | null | undefined,
  membershipRole?: string | null,
): boolean {
  return Boolean(employee) || isMobileManagerRole(membershipRole);
}

export function isTeamView(viewMode?: string | null): boolean {
  return viewMode === 'team' || viewMode === 'admin' || viewMode === 'owner';
}

export function managerRoleLabel(role?: string | null): string | null {
  if (role === 'owner') return 'Business owner';
  if (role === 'admin') return 'Admin';
  if (role === 'manager') return 'Manager';
  return null;
}
