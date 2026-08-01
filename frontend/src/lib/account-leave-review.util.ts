import { bookPath } from '@/lib/tenant-host';

/**
 * e2e-bug.215 — account “Leave a review” must open the post-visit token review
 * page (`/review?bookingId=&token=`), not the public provider profile.
 */
export function shouldShowAccountLeaveReviewCta(canReview: boolean | null | undefined): boolean {
  return canReview === true;
}

export function buildPublicReviewPageHref(
  slug: string,
  bookingId: string,
  token: string,
): string {
  const q = new URLSearchParams({
    bookingId,
    token,
  });
  return `${bookPath(slug, '/review')}?${q.toString()}`;
}

/** Documents the pre-fix bug target so specs can assert we never navigate there. */
export function buildLegacyProviderProfileReviewHref(
  slug: string,
  employeeId: string,
): string {
  return bookPath(slug, `/providers/${employeeId}`);
}

export function isPostVisitReviewHref(href: string): boolean {
  try {
    const url = new URL(href, 'http://local.test');
    return (
      /\/review\/?$/.test(url.pathname) &&
      Boolean(url.searchParams.get('bookingId')) &&
      Boolean(url.searchParams.get('token'))
    );
  } catch {
    return false;
  }
}

export type AccountLeaveReviewSession = {
  bookingId: string;
  token: string;
};

/**
 * Shared click-path used by AccountLeaveReviewButton: fetch session then build
 * the post-visit review href. Never returns a `/providers/…` profile URL.
 */
export async function resolveAccountLeaveReviewHref(
  slug: string,
  bookingId: string,
  fetchSession: (
    slug: string,
    bookingId: string,
  ) => Promise<AccountLeaveReviewSession>,
): Promise<string> {
  const session = await fetchSession(slug, bookingId);
  if (!session?.bookingId || !session?.token) {
    throw new Error('Review session was incomplete');
  }
  return buildPublicReviewPageHref(slug, session.bookingId, session.token);
}
