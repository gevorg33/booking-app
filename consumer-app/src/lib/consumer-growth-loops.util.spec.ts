import { describe, expect, it } from 'vitest';
import {
  REFERRAL_CODE_SCENARIOS,
  MOCK_COMPLETED_BOOKING,
  SHARE_BOOKING_SCENARIOS,
  SHARE_SALON_SCENARIOS,
} from './consumer-growth-loops.fixtures.js';
import {
  buildBookingSharePayload,
  buildReferralInviteLink,
  buildSalonSharePayload,
  deriveReferralCode,
  listSavedSalonSlugs,
  resolveAccountRebookTarget,
} from './consumer-growth-loops.util.js';

describe('consumer-growth-loops.util', () => {
  it.each(REFERRAL_CODE_SCENARIOS)('$id derives referral code', ({ customerId, expected }) => {
    expect(deriveReferralCode(customerId)).toBe(expected);
  });

  it('builds referral invite link with ref param', () => {
    const url = buildReferralInviteLink({
      slug: 'demo-salon',
      referralCode: 'FRIEND10',
      origin: 'https://book.example.com',
    });
    expect(url).toContain('/book/demo-salon');
    expect(url).toContain('ref=FRIEND10');
    expect(url).toContain('src=referral');
  });

  it.each(SHARE_SALON_SCENARIOS)('$id builds salon share payload', (scenario) => {
    const payload = buildSalonSharePayload({
      slug: scenario.slug,
      businessName: scenario.businessName,
      serviceId: 'serviceId' in scenario ? scenario.serviceId : null,
      serviceName: 'serviceName' in scenario ? scenario.serviceName : null,
      origin: 'https://book.example.com',
    });
    expect(payload.url).toContain(scenario.expectUrlContains);
    expect(payload.url).toContain(scenario.expectQueryContains);
    expect(payload.text).toContain(scenario.businessName);
  });

  it.each(SHARE_BOOKING_SCENARIOS)('$id builds booking share payload', (scenario) => {
    const payload = buildBookingSharePayload({
      slug: scenario.slug,
      businessName: scenario.businessName,
      booking: scenario.booking,
      origin: 'https://book.example.com',
    });
    expect(payload.url).toContain(scenario.expectQueryContains);
    expect(payload.text).toContain(scenario.booking.serviceName);
  });

  it('falls back to in-app service path when web origin is missing', () => {
    const payload = buildSalonSharePayload({
      slug: 'demo-salon',
      businessName: 'Demo Salon',
      serviceId: 'svc-haircut',
      serviceName: 'Haircut',
      origin: '',
    });
    expect(payload.url).toContain('/s/demo-salon/book/svc-haircut');
  });

  it('resolves account rebook target from completed booking', () => {
    const target = resolveAccountRebookTarget([MOCK_COMPLETED_BOOKING], 'demo-salon');
    expect(target?.booking.id).toBe('bk-rebook-1');
    expect(target?.path).toContain('svc-haircut');
    expect(target?.path).toContain('rebook=1');
    expect(target?.path).toContain('rebookSource=account');
    expect(target?.path).toContain('slot=2026-05-01');
  });

  it('lists saved salon slugs from storage helpers', () => {
    expect(Array.isArray(listSavedSalonSlugs())).toBe(true);
  });
});
