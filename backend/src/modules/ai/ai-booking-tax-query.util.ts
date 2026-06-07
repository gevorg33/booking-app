import type { Repository } from 'typeorm';
import type { Booking } from '../booking/entities/booking.entity.js';
import {
  extractBookingIdFromPrompt,
  extractCustomerNameFromPrompt,
} from './ai-retail-finance.util.js';

export interface BookingTaxQueryDeps {
  bookingRepo: Pick<Repository<Booking>, 'findOne' | 'find'>;
}

export interface ParsedBookingTaxQuery {
  bookingId?: string;
  customerName?: string;
}

export function parseBookingTaxQueryFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedBookingTaxQuery {
  const bookingIdFromPrompt =
    extractBookingIdFromPrompt(prompt) ??
    prompt.match(/\bappointment\s+([a-z0-9-]{2,})\b/i)?.[1] ??
    null;
  const bookingId =
    (typeof params.bookingId === 'string' && params.bookingId.trim()
      ? params.bookingId.trim()
      : undefined) ??
    bookingIdFromPrompt ??
    undefined;
  const possessiveCustomer = prompt.match(
    /\bfor\s+([A-Za-z][\w]+)(?:'s)?\s+booking\b/i,
  );
  const customerName =
    (typeof params.customerName === 'string' && params.customerName.trim()
      ? params.customerName.trim()
      : undefined) ??
    possessiveCustomer?.[1]?.trim() ??
    extractCustomerNameFromPrompt(prompt) ??
    undefined;

  const parsed: ParsedBookingTaxQuery = {};
  if (bookingId) parsed.bookingId = bookingId;
  if (customerName) parsed.customerName = customerName;
  return parsed;
}

export function bookingHasFrozenTaxPricing(booking: Booking): boolean {
  const metadata = (booking.metadata ?? {}) as Record<string, unknown>;
  const pricing = metadata.pricing;
  if (!pricing || typeof pricing !== 'object') return false;
  return (pricing as Record<string, unknown>).taxEnabled === true;
}

export function readBookingPricingTaxMetadata(
  booking: Booking,
): Record<string, unknown> | null {
  const metadata = (booking.metadata ?? {}) as Record<string, unknown>;
  const pricing = metadata.pricing;
  if (!pricing || typeof pricing !== 'object') return null;

  const row = pricing as Record<string, unknown>;
  const taxRules = Array.isArray(row.taxRules) ? row.taxRules : undefined;
  return {
    taxEnabled: row.taxEnabled === true,
    taxName: typeof row.taxName === 'string' ? row.taxName : null,
    taxRate: row.taxRate ?? null,
    taxModel:
      row.taxModel === 'inclusive' || row.taxModel === 'exclusive'
        ? row.taxModel
        : null,
    taxAmount: row.taxAmount ?? null,
    netAmount: row.netAmount ?? null,
    amountDue: row.amountDue ?? null,
    servicePrice: row.servicePrice ?? null,
    subtotal: row.subtotal ?? null,
    ...(taxRules ? { taxRules } : {}),
    amountPaid: metadata.amountPaid ?? null,
    cashPaidEligible: metadata.cashPaidEligible ?? null,
    paidVia: metadata.paidVia ?? null,
    stripeSessionId: metadata.stripeSessionId ?? null,
  };
}

export async function resolveBookingForTaxQuery(
  deps: BookingTaxQueryDeps,
  businessId: string,
  parsed: ParsedBookingTaxQuery,
  options: { preferTaxPricing?: boolean } = {},
): Promise<Booking | null> {
  const preferTaxPricing = options.preferTaxPricing ?? true;

  if (parsed.bookingId) {
    const byId = await deps.bookingRepo.findOne({
      where: { id: parsed.bookingId, businessId },
      relations: { customer: true, service: true, employee: true },
    });
    if (byId) return byId;

    const bookings = await deps.bookingRepo.find({
      where: { businessId },
      relations: { customer: true, service: true, employee: true },
      order: { startTime: 'DESC' },
      take: 100,
    });
    return (
      bookings.find(
        (booking) =>
          booking.id === parsed.bookingId ||
          booking.id.startsWith(parsed.bookingId!),
      ) ?? null
    );
  }

  const bookings = await deps.bookingRepo.find({
    where: { businessId },
    relations: { customer: true, service: true, employee: true },
    order: { startTime: 'DESC' },
    take: 50,
  });

  if (parsed.customerName) {
    const needle = parsed.customerName.toLowerCase();
    const matches = bookings.filter((booking) =>
      (booking.customer?.name ?? '').toLowerCase().includes(needle),
    );
    if (preferTaxPricing) {
      const withTax = matches.find(bookingHasFrozenTaxPricing);
      if (withTax) return withTax;
    }
    if (matches.length === 1) return matches[0];
    if (matches.length > 0) return matches[0];
  }

  if (preferTaxPricing) {
    return bookings.find(bookingHasFrozenTaxPricing) ?? null;
  }
  return bookings[0] ?? null;
}
