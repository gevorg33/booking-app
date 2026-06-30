import { buildProviderGuidePath } from './provider-guide.util.js';

/** Staff invite playbook — ai-cmd-provider-5.21.1 / ai-guide-1.9.8. */
export const PROVIDER_STAFF_INVITE_GUIDE_TOPIC_ID = 'provider-staff-invite' as const;

export function buildProviderGuideEntryPath(
  query?: Record<string, string | undefined | null>,
): string {
  return buildProviderGuidePath(query);
}

export function buildProviderInviteGuideEntryPath(): string {
  return buildProviderGuidePath({ topicId: PROVIDER_STAFF_INVITE_GUIDE_TOPIC_ID });
}
