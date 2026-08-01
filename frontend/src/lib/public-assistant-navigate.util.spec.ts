import { describe, expect, it } from 'vitest';
import {
  buildPublicAssistantHref,
  dateKeyFromStartTime,
} from './public-assistant-navigate.util';

describe('buildPublicAssistantHref (e2e-bug.224 / e2e-bug.228)', () => {
  const slug = 'gevgas-operations-7c299253';

  it.each([
    {
      id: 'packages-no-id-to-any',
      navigate: { path: 'packages', query: {} },
      href: `/book/${slug}/any`,
    },
    {
      id: 'packages-with-id',
      navigate: { path: 'packages', query: { packageId: 'pkg-spa' } },
      href: `/book/${slug}/packages/pkg-spa`,
    },
    {
      id: 'packages-with-id-drops-query-packageId-from-qs-path',
      navigate: {
        path: 'packages',
        query: { packageId: 'pkg-spa', employeeName: 'Alex' },
      },
      href: `/book/${slug}/packages/pkg-spa?employeeName=Alex`,
    },
    {
      id: 'login-to-account',
      navigate: { path: 'login', query: { provider: 'google' } },
      href: `/book/${slug}/account?provider=google`,
    },
    {
      id: 'login-manage-reason',
      navigate: { path: 'login', query: { reason: 'manage_booking' } },
      href: `/book/${slug}/account?reason=manage_booking`,
    },
    {
      id: 'home',
      navigate: { path: 'home', query: {} },
      href: `/book/${slug}`,
    },
    {
      id: 'tenant-switch',
      navigate: { path: 'tenant_switch', query: {} },
      href: `/book/${slug}`,
    },
    {
      id: 'salon-with-slug',
      navigate: { path: 'salon', query: { slug: 'other-salon' } },
      href: `/book/other-salon`,
    },
    {
      id: 'salon-missing-slug-falls-back-current',
      navigate: { path: 'salon', query: {} },
      href: `/book/${slug}`,
    },
    {
      id: 'provider-profile',
      navigate: { path: 'provider_profile', query: { employeeId: 'emp-1' } },
      href: `/book/${slug}/providers/emp-1`,
    },
    {
      id: 'provider-profile-missing-id',
      navigate: { path: 'provider_profile', query: {} },
      href: null,
    },
    {
      id: 'account',
      navigate: { path: 'account', query: { section: 'results' } },
      href: `/book/${slug}/account?section=results`,
    },
    {
      id: 'checkout-single',
      navigate: {
        path: 'checkout',
        query: {
          serviceId: 'svc-1',
          startTime: '2026-06-09T14:00:00.000Z',
          employeeId: 'emp-2',
        },
      },
      href: `/book/${slug}/checkout?serviceId=svc-1&startTime=2026-06-09T14%3A00%3A00.000Z&employeeId=emp-2`,
    },
    {
      id: 'checkout-package-confirm',
      navigate: { path: 'checkout', query: { packageId: 'pkg-spa' } },
      href: `/book/${slug}/packages/pkg-spa`,
    },
    {
      // e2e-bug.228 — suggest_package_block shape (packageId + startTime, no serviceId)
      id: 'checkout-suggest-package-block-to-package-confirm',
      navigate: {
        path: 'checkout',
        query: {
          packageId: 'pkg-spa',
          startTime: '2026-08-01T10:00:00.000Z',
        },
      },
      href: `/book/${slug}/packages/pkg-spa?startTime=2026-08-01T10%3A00%3A00.000Z`,
    },
    {
      id: 'checkout-package-with-lines',
      navigate: {
        path: 'checkout',
        query: { packageId: 'pkg-spa', lines: '[]' },
      },
      href: `/book/${slug}/packages/pkg-spa/checkout?lines=%5B%5D`,
    },
    {
      id: 'checkout-package-with-lines-and-employee',
      navigate: {
        path: 'checkout',
        query: {
          packageId: 'pkg-spa',
          lines: '[{"serviceId":"s1","employeeId":"e1","startTime":"2026-08-01T10:00:00.000Z"}]',
          employeeName: 'Gevorg',
        },
      },
      href: `/book/${slug}/packages/pkg-spa/checkout?lines=%5B%7B%22serviceId%22%3A%22s1%22%2C%22employeeId%22%3A%22e1%22%2C%22startTime%22%3A%222026-08-01T10%3A00%3A00.000Z%22%7D%5D&employeeName=Gevorg`,
    },
    {
      id: 'checkout-package-does-not-prefer-when-serviceId-present',
      navigate: {
        path: 'checkout',
        query: {
          packageId: 'pkg-spa',
          serviceId: 'svc-1',
          startTime: '2026-08-01T10:00:00.000Z',
        },
      },
      href: `/book/${slug}/checkout?packageId=pkg-spa&serviceId=svc-1&startTime=2026-08-01T10%3A00%3A00.000Z`,
    },
    {
      id: 'checkout-multi-via-services-query',
      navigate: {
        path: 'checkout',
        query: { services: 'a,b', startTime: '2026-06-09T09:00:00.000Z' },
      },
      href: `/book/${slug}/multi/checkout?services=a%2Cb&startTime=2026-06-09T09%3A00%3A00.000Z`,
    },
    {
      id: 'multi-checkout',
      navigate: { path: 'multi/checkout', query: { services: 'a,b' } },
      href: `/book/${slug}/multi/checkout?services=a%2Cb`,
    },
    {
      id: 'gift-cards',
      navigate: { path: 'gift-cards', query: {} },
      href: `/book/${slug}/gift-cards`,
    },
    {
      id: 'gift-cards-checkout',
      navigate: { path: 'gift-cards/checkout', query: { amount: '50' } },
      href: `/book/${slug}/gift-cards/checkout?amount=50`,
    },
    {
      id: 'professionals',
      navigate: { path: 'professionals', query: {} },
      href: `/book/${slug}/professionals`,
    },
    {
      id: 'profile',
      navigate: { path: 'profile', query: {} },
      href: `/book/${slug}/profile`,
    },
    {
      id: 'guide-falls-home',
      navigate: { path: 'guide', query: { topicId: 'getting-started' } },
      href: `/book/${slug}?topicId=getting-started`,
    },
  ])('$id → $href', ({ navigate, href }) => {
    expect(buildPublicAssistantHref(slug, navigate)).toBe(href);
  });

  it('never produces the pre-fix 404 paths', () => {
    expect(buildPublicAssistantHref(slug, { path: 'packages', query: {} })).not.toBe(
      `/book/${slug}/packages`,
    );
    expect(buildPublicAssistantHref(slug, { path: 'login', query: {} })).not.toBe(
      `/book/${slug}/login`,
    );
    expect(buildPublicAssistantHref(slug, { path: 'home', query: {} })).not.toBe(
      `/book/${slug}/home`,
    );
    expect(
      buildPublicAssistantHref(slug, { path: 'salon', query: { slug: 'x' } }),
    ).not.toBe(`/book/${slug}/salon`);
  });

  it('e2e-bug.228 — suggest_package_block navigate never lands on single-service checkout', () => {
    const href = buildPublicAssistantHref(slug, {
      path: 'checkout',
      query: {
        packageId: '570ca68d-30df-4988-8070-e17604f20f00',
        startTime: '2026-08-01T10:00:00.000Z',
      },
    });
    expect(href).toMatch(/\/packages\/570ca68d-30df-4988-8070-e17604f20f00/);
    expect(href).not.toMatch(/\/checkout\?/);
    expect(href).not.toContain('packageId=');
  });

  it('dateKeyFromStartTime extracts UTC date', () => {
    expect(dateKeyFromStartTime('2026-06-09T14:00:00.000Z')).toBe('2026-06-09');
    expect(dateKeyFromStartTime('not-a-date')).toBe('');
  });
});
