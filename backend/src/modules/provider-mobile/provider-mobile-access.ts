import { MemberRole } from '../business/entities/business-member.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';

/**
 * Roles with team-wide mobile access:
 * - owner: first registered dashboard user for the business
 * - admin, manager: invited users who manage schedules in the dashboard
 */
export const MOBILE_MANAGER_ROLES: MemberRole[] = [
  MemberRole.OWNER,
  MemberRole.ADMIN,
  MemberRole.MANAGER,
];

export type MobileViewMode = 'provider' | 'team';

export interface MobileAccess {
  viewMode: MobileViewMode;
  membershipRole: MemberRole;
  employee: Employee | null;
}

export function isMobileManagerRole(role: MemberRole): boolean {
  return MOBILE_MANAGER_ROLES.includes(role);
}
