export type TeamMemberRole = 'owner' | 'admin' | 'manager' | 'staff' | 'contributor';

export interface BusinessSummary {
  id: string;
  name: string;
  slug: string;
  locale?: string;
  dateFormat?: string;
  timeFormat?: string;
  /** Safe settings slice from auth (e.g. businessType) — e2e-bug.61 */
  settings?: Record<string, unknown>;
  membershipRole: TeamMemberRole;
  employee: { id: string; name: string } | null;
}

export interface AuthResult {
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    locale?: string;
  };
  business: {
    id: string;
    name: string;
    slug: string;
    locale?: string;
    dateFormat?: string;
    timeFormat?: string;
    membershipRole?: TeamMemberRole;
    settings?: Record<string, unknown>;
  } | null;
  employee: { id: string; name: string } | null;
  businesses: BusinessSummary[];
  token: string | null;
  requiresBusinessSelection: boolean;
}

export function unwrapAuthResult(data: unknown): AuthResult {
  const payload = (data as { data?: AuthResult })?.data ?? data;
  return payload as AuthResult;
}
