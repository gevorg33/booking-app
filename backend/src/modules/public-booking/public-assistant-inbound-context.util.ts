/**
 * e2e-bug.261 / e2e-bug.96 — public assistant clients must never be able to
 * forge authenticated identity via context (customerId / sessionCustomerId).
 * Trusted identity is applied only from OptionalPublicCustomerAuthGuard JWT.
 */
export const PUBLIC_ASSISTANT_INBOUND_IDENTITY_KEYS = [
  'customerId',
  'sessionCustomerId',
  'userId',
  'userEmail',
  'membershipRole',
  'customerEmail',
] as const;

export function sanitizeInboundPublicAssistantContext(
  context: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!context || typeof context !== 'object' || Array.isArray(context)) {
    return {};
  }
  const next: Record<string, unknown> = { ...context };
  for (const key of PUBLIC_ASSISTANT_INBOUND_IDENTITY_KEYS) {
    delete next[key];
  }
  return next;
}

export function buildPublicAssistantGatewayContext(input: {
  slug: string;
  locale?: string;
  dtoContext?: Record<string, unknown> | null;
  authCustomerId?: string | null;
  authEmail?: string | null;
}): Record<string, unknown> {
  return {
    slug: input.slug,
    locale: input.locale,
    ...sanitizeInboundPublicAssistantContext(input.dtoContext),
    // Trusted identity always wins — anonymous clears forgeries.
    customerId: input.authCustomerId ?? undefined,
    userEmail: input.authEmail ?? undefined,
  };
}
