import { MemberRole } from '../business/entities/business-member.entity.js';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  businessId?: string;
  membershipRole?: MemberRole;
  employeeId?: string | null;
}

export interface BusinessAuthSummary {
  id: string;
  name: string;
  slug: string;
  locale: string;
  membershipRole: MemberRole;
  employee: { id: string; name: string } | null;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    locale: string;
  };
  business: {
    id: string;
    name: string;
    slug: string;
    locale: string;
    membershipRole: MemberRole;
  } | null;
  employee: { id: string; name: string } | null;
  businesses: BusinessAuthSummary[];
  token: string | null;
  requiresBusinessSelection: boolean;
}

export interface TenantHint {
  businessId?: string;
  businessSlug?: string;
}
