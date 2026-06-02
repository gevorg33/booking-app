import { randomBytes } from 'crypto';
import type { Repository } from 'typeorm';
import type { Booking } from '../../modules/booking/entities/booking.entity.js';

export async function ensureBookingManageToken(
  bookingRepo: Repository<Booking>,
  bookingId: string,
): Promise<string> {
  const booking = await bookingRepo.findOne({ where: { id: bookingId } });
  if (!booking) throw new Error('Booking not found');

  const metadata = { ...(booking.metadata || {}) };
  if (metadata.manageToken && typeof metadata.manageToken === 'string') {
    return metadata.manageToken;
  }

  const token = randomBytes(24).toString('hex');
  metadata.manageToken = token;
  booking.metadata = metadata;
  await bookingRepo.save(booking);
  return token;
}

export function buildBookingManageUrl(
  frontendUrl: string,
  slug: string,
  bookingId: string,
  token: string,
): string {
  const base = frontendUrl.replace(/\/$/, '');
  const params = new URLSearchParams({ bookingId, token });
  return `${base}/book/${slug}/manage?${params.toString()}`;
}

/** Plain-text fallback (includes URL for non-HTML clients). */
export function formatBookingManageLinkText(label: string, url: string): string {
  return `${label}: ${url}`;
}

/** HTML manage link — label text with underlined "here" anchor instead of raw URL. */
export function formatBookingManageLinkHtml(label: string, url: string): string {
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
  return typeof expected === 'string' && expected.length > 0 && expected === token;
}
