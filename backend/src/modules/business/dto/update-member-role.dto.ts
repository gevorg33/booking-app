import { IsEnum } from 'class-validator';
import { MemberRole } from '../entities/business-member.entity.js';

/** Roles the business owner may assign (not owner). */
export const ASSIGNABLE_MEMBER_ROLES = [
  MemberRole.ADMIN,
  MemberRole.MANAGER,
  MemberRole.STAFF,
  MemberRole.CONTRIBUTOR,
] as const;

export type AssignableMemberRole = (typeof ASSIGNABLE_MEMBER_ROLES)[number];

export class UpdateMemberRoleDto {
  @IsEnum(ASSIGNABLE_MEMBER_ROLES)
  role: AssignableMemberRole;
}
