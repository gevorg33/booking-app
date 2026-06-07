import { createHmac, timingSafeEqual } from 'crypto';
import type { ClinicLabSyncInboundSource } from './clinic-lis.types.js';
import { CLINIC_LAB_SYNC_INBOUND_SOURCES } from './clinic-lis.types.js';

export function readClinicLisInboundWebhookSecret(
  settings?: Record<string, unknown>,
): string | null {
  const clinicLis = settings?.clinicLis as Record<string, unknown> | undefined;
  const secret = clinicLis?.inboundWebhookSecret;
  return typeof secret === 'string' && secret.trim() ? secret.trim() : null;
}

export function computeClinicLisInboundWebhookSignature(
  secret: string,
  rawBody: Buffer | string,
): string {
  return createHmac('sha256', secret).update(rawBody).digest('hex');
}

export function verifyClinicLisInboundWebhookSignature(
  secret: string,
  rawBody: Buffer | string,
  signatureHeader: string | undefined,
): boolean {
  if (!signatureHeader?.trim()) return false;
  const expected = computeClinicLisInboundWebhookSignature(secret, rawBody);
  const provided = signatureHeader.trim();
  if (expected.length !== provided.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
}

export function isClinicLabSyncInboundSource(
  value: unknown,
): value is ClinicLabSyncInboundSource {
  return (
    typeof value === 'string' &&
    (CLINIC_LAB_SYNC_INBOUND_SOURCES as readonly string[]).includes(value)
  );
}

export function resolveClinicLabSyncInboundSource(input: {
  contentType: string;
  sourceOverride?: string | null;
  rawPayload: string;
}): ClinicLabSyncInboundSource {
  if (input.sourceOverride) {
    if (!isClinicLabSyncInboundSource(input.sourceOverride)) {
      throw new Error(
        `Unsupported inbound source override: ${input.sourceOverride}`,
      );
    }
    return input.sourceOverride;
  }

  const contentType = input.contentType.toLowerCase();
  if (contentType.includes('hl7')) return 'hl7';
  if (contentType.includes('fhir')) return 'fhir';

  if (contentType.includes('json') || contentType.includes('text/plain')) {
    try {
      const parsed = JSON.parse(input.rawPayload) as { resourceType?: string };
      if (parsed.resourceType === 'Bundle') return 'fhir';
    } catch {
      // fall through to vendor_json for plain JSON payloads
    }
    if (contentType.includes('json')) return 'vendor_json';
  }

  if (contentType.includes('text/plain') && input.rawPayload.includes('MSH|')) {
    return 'hl7';
  }

  throw new Error(
    'Unable to determine inbound LIS message source from Content-Type',
  );
}
