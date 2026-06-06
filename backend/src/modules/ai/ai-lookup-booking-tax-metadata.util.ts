import {
  parseBookingTaxQueryFromPrompt,
  type ParsedBookingTaxQuery,
} from './ai-booking-tax-query.util.js';

export const LOOKUP_BOOKING_TAX_METADATA_INTENTS = [
  'lookup_booking_tax_metadata',
] as const;

export type LookupBookingTaxMetadataIntent =
  (typeof LOOKUP_BOOKING_TAX_METADATA_INTENTS)[number];

export function hasLookupBookingTaxMetadataContext(prompt: string): boolean {
  if (
    /\b(metadata\.pricing|tax\s+metadata|frozen\s+tax|tax\s+breakdown|tax\s+fields|tax\s+snapshot)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }
  if (
    /\b(lookup|retrieve|pull|get|show|fetch)\b/i.test(prompt) &&
    /\b(tax|vat|gst|pst|metadata|pricing|receipt|dispute)\b/i.test(prompt)
  ) {
    return true;
  }
  if (
    /\b(stripe|checkout|online\s+payment)\b/i.test(prompt) &&
    /\b(tax|metadata|breakdown|receipt|dispute)\b/i.test(prompt)
  ) {
    return true;
  }
  return false;
}

export function isLookupBookingTaxMetadataPrompt(prompt: string): boolean {
  if (!hasLookupBookingTaxMetadataContext(prompt)) return false;

  if (
    /\b(our|salon|business|settings|on\s+file|example)\b/i.test(prompt) &&
    !/\b(booking|metadata|stripe|checkout|dispute|receipt|customer)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }

  if (
    /\bwhy\b/i.test(prompt) &&
    /\b(charged|charge|stripe)\b/i.test(prompt) &&
    !/\b(metadata|lookup|retrieve|frozen|snapshot)\b/i.test(prompt)
  ) {
    return false;
  }

  if (
    /\b(provider|appointment|payment\s+breakdown|mark\s+paid|pos)\b/i.test(
      prompt,
    ) &&
    !/\b(metadata|lookup|retrieve|support|dispute|receipt)\b/i.test(prompt)
  ) {
    return false;
  }

  const bookingAnchor =
    /\b(booking|metadata\.pricing|metadata|stripe|checkout|dispute|receipt|frozen|snapshot|support\s+ticket)\b/i.test(
      prompt,
    ) ||
    /\b(?:lookup|retrieve|pull|fetch)\b/i.test(prompt) ||
    /\bfor\s+[A-Za-z][\w]+(?:'s)?\s+(?:stripe|checkout|booking)\b/i.test(
      prompt,
    );

  if (!bookingAnchor) return false;

  const lookupCue =
    /\b(?:lookup|retrieve|pull|get|show|fetch|what|which)\b/i.test(prompt) ||
    /\b(?:metadata|frozen|snapshot|dispute|receipt|support)\b/i.test(prompt);

  return lookupCue;
}

export function parseLookupBookingTaxMetadataFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedBookingTaxQuery | null {
  if (!isLookupBookingTaxMetadataPrompt(prompt)) return null;
  return parseBookingTaxQueryFromPrompt(prompt, params);
}

export function rescueLookupBookingTaxMetadataIntent(
  prompt: string,
  action: string,
): { action: LookupBookingTaxMetadataIntent; rescueReason: string } | null {
  if ((LOOKUP_BOOKING_TAX_METADATA_INTENTS as readonly string[]).includes(action)) {
    return null;
  }

  if (!isLookupBookingTaxMetadataPrompt(prompt)) return null;
  return {
    action: 'lookup_booking_tax_metadata',
    rescueReason: 'lookup_booking_tax_metadata',
  };
}
