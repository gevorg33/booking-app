import {
  buildCheckoutReturnUrls,
  buildConsumerCheckoutPath,
  isAllowedCheckoutReturnOrigin,
  normalizeCheckoutClientSurface,
  resolveCheckoutReturnBaseUrl,
  toConsumerSingleSuccessQuery,
} from './checkout-return-url.util.js';

describe('checkout-return-url.util (e2e-bug.18)', () => {
  it('defaults clientSurface to web', () => {
    expect(normalizeCheckoutClientSurface(undefined)).toBe('web');
    expect(normalizeCheckoutClientSurface('consumer')).toBe('consumer');
  });

  it.each([
    {
      id: 'e2e-bug.18-allowlisted-consumer-origin',
      candidate: 'http://localhost:5174/s/demo/book',
      allowlist: ['http://localhost:5174'],
      allowLocal: false,
      expected: true,
    },
    {
      id: 'e2e-bug.18-rejects-foreign-origin',
      candidate: 'https://evil.example',
      allowlist: ['http://localhost:5174'],
      allowLocal: false,
      expected: false,
    },
    {
      id: 'e2e-bug.18-local-dev-origin',
      candidate: 'http://127.0.0.1:5174',
      allowlist: [],
      allowLocal: true,
      expected: true,
    },
  ])('$id isAllowedCheckoutReturnOrigin', ({ candidate, allowlist, allowLocal, expected }) => {
    expect(isAllowedCheckoutReturnOrigin(candidate, allowlist, allowLocal)).toBe(
      expected,
    );
  });

  it('resolves consumer base from returnOrigin when allowlisted', () => {
    const resolved = resolveCheckoutReturnBaseUrl({
      clientSurface: 'consumer',
      returnOrigin: 'http://localhost:5174',
      frontendUrl: 'http://localhost:3000',
      consumerAppUrl: 'http://localhost:5174',
    });
    expect(resolved).toEqual({
      baseUrl: 'http://localhost:5174',
      surface: 'consumer',
    });
  });

  it('falls back to web when consumer surface has no configured/allowed origin', () => {
    const resolved = resolveCheckoutReturnBaseUrl({
      clientSurface: 'consumer',
      returnOrigin: 'https://evil.example',
      frontendUrl: 'http://localhost:3000',
      consumerAppUrl: '',
      allowLocalDevOrigins: false,
    });
    expect(resolved.surface).toBe('web');
    expect(resolved.baseUrl).toBe('http://localhost:3000');
  });

  it('builds consumer package paths', () => {
    expect(
      buildConsumerCheckoutPath({
        slug: 'Glow-Nails',
        kind: 'package',
        packageId: 'pkg-1',
      }),
    ).toBe('/s/glow-nails/book/packages/pkg-1/checkout');
  });

  it('maps single-service startTime to slot/date for consumer BookPage', () => {
    const qs = toConsumerSingleSuccessQuery(
      'paid=1&serviceId=svc-1&startTime=2026-07-14T09:30:00.000Z&session_id={CHECKOUT_SESSION_ID}',
    );
    expect(qs).toContain('slot=2026-07-14T09%3A30%3A00.000Z');
    expect(qs).toContain('date=2026-07-14');
    expect(qs).toContain('session_id={CHECKOUT_SESSION_ID}');
    expect(qs).not.toContain('%7B');
  });

  it('e2e-bug.18-consumer-single: success/cancel use consumer host and /s paths', () => {
    const urls = buildCheckoutReturnUrls({
      clientSurface: 'consumer',
      returnOrigin: 'http://localhost:5174',
      frontendUrl: 'http://localhost:3000',
      consumerAppUrl: 'http://localhost:5174',
      slug: 'gevgas-operations-7c299253',
      kind: 'single',
      webPathSuffix: '/checkout',
      serviceId: 'svc-massage',
      successQuery:
        'paid=1&serviceId=svc-massage&startTime=2026-07-14T09:30:00.000Z&session_id={CHECKOUT_SESSION_ID}',
      cancelQuery:
        'canceled=1&serviceId=svc-massage&startTime=2026-07-14T09:30:00.000Z',
    });
    expect(urls.successUrl.startsWith('http://localhost:5174/s/gevgas-operations-7c299253/book/svc-massage?')).toBe(
      true,
    );
    expect(urls.successUrl).toContain('slot=2026-07-14T09%3A30%3A00.000Z');
    expect(urls.successUrl).toContain('session_id={CHECKOUT_SESSION_ID}');
    expect(urls.successUrl).not.toContain('%7B');
    expect(urls.cancelUrl).toContain('/s/gevgas-operations-7c299253/book/svc-massage?');
    expect(urls.cancelUrl).not.toContain('localhost:3000');
  });

  it('e2e-bug.18-web-default: keeps /book paths on FRONTEND_URL', () => {
    const urls = buildCheckoutReturnUrls({
      frontendUrl: 'https://app.test',
      slug: 'salon',
      kind: 'package',
      packageId: 'pkg-1',
      webPathSuffix: '/packages/pkg-1/checkout',
      successQuery: 'paid=1&packageId=pkg-1&session_id={CHECKOUT_SESSION_ID}',
      cancelQuery: 'canceled=1',
    });
    expect(urls.successUrl).toBe(
      'https://app.test/book/salon/packages/pkg-1/checkout?paid=1&packageId=pkg-1&session_id={CHECKOUT_SESSION_ID}',
    );
    expect(urls.cancelUrl).toBe(
      'https://app.test/book/salon/packages/pkg-1/checkout?canceled=1',
    );
  });
});
