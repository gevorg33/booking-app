const MOBILE_MANAGER_ROLES = new Set(['owner', 'admin', 'manager']);

export function isMobileManagerRole(role: string | undefined | null): boolean {
  return !!role && MOBILE_MANAGER_ROLES.has(role);
}

export function canAccessProviderApp(
  employee: { id: string; name: string } | null | undefined,
  membershipRole: string | undefined | null,
): boolean {
  return Boolean(employee) || isMobileManagerRole(membershipRole);
}
