import { randomBytes } from 'crypto';
import type { EntityManager, Repository } from 'typeorm';
import { Booking } from '../../modules/booking/entities/booking.entity.js';
import { buildTenantPublicUrl } from './tenant-public-url.util.js';

/** Fresh guest manage-link token (48 hex chars). */
export function generateBookingManageToken(): string {
  return randomBytes(24).toString('hex');
}

function readExistingManageToken(
  metadata: Record<string, unknown> | null | undefined,
): string | null {
  const token = metadata?.manageToken;
  return typeof token === 'string' && token.length > 0 ? token : null;
}

/**
 * api-bug.6 / e2e-bug.120 — ensure a manage token under SELECT … FOR UPDATE so
 * concurrent callers (create response + confirmation email) cannot each mint a
 * different token and leave the response holding a stale value.
 */
export async function ensureBookingManageToken(
  bookingRepo: Repository<Booking>,
  bookingId: string,
): Promise<string> {
  return bookingRepo.manager.transaction(async (manager: EntityManager) => {
    const booking = await manager
      .createQueryBuilder(Booking, 'booking')
      .setLock('pessimistic_write')
      .where('booking.id = :bookingId', { bookingId })
      .getOne();
    if (!booking) throw new Error('Booking not found');

    const existing = readExistingManageToken(booking.metadata);
    if (existing) return existing;

    const token = generateBookingManageToken();
    booking.metadata = { ...(booking.metadata || {}), manageToken: token };
    await manager.save(Booking, booking);
    return token;
  });
}

export function buildBookingManageUrl(
  frontendUrl: string,
  slug: string,
  bookingId: string,
  token: string,
  rootDomain?: string,
): string {
  return buildTenantPublicUrl({
    slug,
    frontendUrl,
    rootDomain,
    pathSuffix: '/manage',
    query: { bookingId, token },
  });
}

/** Plain-text fallback (includes URL for non-HTML clients). */
export function formatBookingManageLinkText(
  label: string,
  url: string,
): string {
  return `${label}: ${url}`;
}

/** HTML manage link — label text with underlined "here" anchor instead of raw URL. */
export function formatBookingManageLinkHtml(
  label: string,
  url: string,
): string {
  const safeUrl = url
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const safeLabel = label
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `${safeLabel}: <a href="${safeUrl}" style="text-decoration:underline">here</a>`;
}

export function validateBookingManageToken(
  booking: Booking,
  token: string,
): boolean {
  const expected = booking.metadata?.manageToken;
  return (
    typeof expected === 'string' && expected.length > 0 && expected === token
  );
}
