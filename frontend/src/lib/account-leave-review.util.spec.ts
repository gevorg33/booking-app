import { describe, expect, it, vi } from 'vitest';
import {
  buildLegacyProviderProfileReviewHref,
  buildPublicReviewPageHref,
  isPostVisitReviewHref,
  resolveAccountLeaveReviewHref,
  shouldShowAccountLeaveReviewCta,
} from './account-leave-review.util';

describe('account-leave-review.util (e2e-bug.215)', () => {
  it.each([
    { id: 'true', canReview: true, expected: true },
    { id: 'false', canReview: false, expected: false },
    { id: 'null', canReview: null, expected: false },
    { id: 'undefined', canReview: undefined, expected: false },
  ])('shouldShowAccountLeaveReviewCta: $id', ({ canReview, expected }) => {
    expect(shouldShowAccountLeaveReviewCta(canReview)).toBe(expected);
  });

  it('buildPublicReviewPageHref includes bookingId + token on /review', () => {
    const href = buildPublicReviewPageHref('demo-salon', 'bk-1', 'tok-abc');
    expect(href).toBe(
      '/book/demo-salon/review?bookingId=bk-1&token=tok-abc',
    );
    expect(isPostVisitReviewHref(href)).toBe(true);
  });

  it('documents the bug: provider profile is NOT a post-visit review href', () => {
    const legacy = buildLegacyProviderProfileReviewHref(
      'demo-salon',
      'emp-1',
    );
    expect(legacy).toBe('/book/demo-salon/providers/emp-1');
    expect(isPostVisitReviewHref(legacy)).toBe(false);
  });

  it.each([
    {
      id: 'missing-token',
      href: '/book/demo/review?bookingId=bk-1',
      expected: false,
    },
    {
      id: 'missing-bookingId',
      href: '/book/demo/review?token=tok',
      expected: false,
    },
    {
      id: 'provider-profile',
      href: '/book/demo/providers/emp',
      expected: false,
    },
    {
      id: 'happy',
      href: '/book/demo/review?bookingId=bk-1&token=tok',
      expected: true,
    },
  ])('isPostVisitReviewHref: $id', ({ href, expected }) => {
    expect(isPostVisitReviewHref(href)).toBe(expected);
  });

  it('resolveAccountLeaveReviewHref uses session token (never /providers/)', async () => {
    const fetchSession = vi.fn(async () => ({
      bookingId: 'bk-9',
      token: 'tok-9',
    }));
    const href = await resolveAccountLeaveReviewHref(
      'demo-salon',
      'bk-9',
      fetchSession,
    );
    expect(fetchSession).toHaveBeenCalledWith('demo-salon', 'bk-9');
    expect(href).toBe(
      '/book/demo-salon/review?bookingId=bk-9&token=tok-9',
    );
    expect(isPostVisitReviewHref(href)).toBe(true);
    expect(href).not.toContain('/providers/');
  });

  it.each([
    {
      id: 'missing-token',
      session: { bookingId: 'bk-1', token: '' },
    },
    {
      id: 'missing-bookingId',
      session: { bookingId: '', token: 'tok' },
    },
  ])(
    'resolveAccountLeaveReviewHref rejects incomplete session: $id',
    async ({ session }) => {
      await expect(
        resolveAccountLeaveReviewHref('demo', 'bk-1', async () => session),
      ).rejects.toThrow(/incomplete/i);
    },
  );

  it('resolveAccountLeaveReviewHref surfaces fetch failures', async () => {
    await expect(
      resolveAccountLeaveReviewHref('demo', 'bk-1', async () => {
        throw new Error('Booking is not reviewable');
      }),
    ).rejects.toThrow('Booking is not reviewable');
  });
});
