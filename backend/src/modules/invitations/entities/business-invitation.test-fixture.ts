import type { BusinessInvitation } from './business-invitation.entity.js';
import { MemberRole } from '../../business/entities/business-member.entity.js';

/**
 * Build a complete `BusinessInvitation` for tests.
 *
 * Specs build it as `{ id }`. The omitted fields include `token`, `expiresAt`
 * and `acceptedAt` — the three that decide whether an invitation is still
 * redeemable — so a one-field literal cannot exercise an expiry or
 * already-accepted path at all.
 */
export function makeBusinessInvitation(
  partial: Partial<BusinessInvitation> = {},
): BusinessInvitation {
  return {
    id: 'invitation-test',
    business: undefined as unknown as BusinessInvitation['business'],
    businessId: 'biz-test',
    email: 'invitee@example.test',
    role: MemberRole.STAFF,
    token: 'invitation-token',
    employeeName: 'Test employee',
    employeeId: null,
    createdByUserId: 'user-test',
    expiresAt: new Date('2026-12-31T00:00:00.000Z'),
    acceptedAt: undefined as unknown as BusinessInvitation['acceptedAt'],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...partial,
  };
}
