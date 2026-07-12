import { PublicBookingAssistantService } from './public-booking-assistant.service.js';

/** handleBusinessInfo is private and doesn't reference `this`, so it can be
 * invoked directly off the prototype without constructing the full service
 * (which requires a heavy DI graph). Closes the ai-cmd-customer-6.1 gap:
 * GET /public/:slug returns `privacy` + app-install settings that
 * business_info previously never surfaced. */
function callHandleBusinessInfo(business: {
  name: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  settings?: Record<string, any> | null;
}) {
  return (PublicBookingAssistantService.prototype as any).handleBusinessInfo.call(
    {},
    business,
  );
}

describe('public booking assistant business_info (ai-cmd-customer-6.1)', () => {
  it('includes default privacy policy line when no privacy settings are configured', () => {
    const result = callHandleBusinessInfo({
      name: 'Salon Bliss',
      settings: {},
    });

    expect(result.success).toBe(true);
    expect(result.action).toBe('business_info');
    expect(result.summary).toContain('Privacy: policy v');
    expect(result.summary).not.toContain('AI-processing consent required');
    expect(result.summary).not.toContain('data hosted in');
    expect(result.summary).not.toContain('Get our app:');
  });

  it('surfaces AI-processing consent and data residency when configured', () => {
    const result = callHandleBusinessInfo({
      name: 'Salon Bliss',
      settings: {
        privacy: {
          privacyPolicyVersion: '2.3',
          dataResidencyRegion: 'eu',
          granularConsent: { requireAiProcessing: true },
        },
      },
    });

    expect(result.summary).toContain('Privacy: policy v2.3');
    expect(result.summary).toContain('AI-processing consent required');
    expect(result.summary).toContain('data hosted in EU');
  });

  it('includes the app-install landing link when app-install settings exist', () => {
    const result = callHandleBusinessInfo({
      name: 'Salon Bliss',
      settings: {
        appInstall: {
          landingUrl: 'https://example.com/get-app/salon-bliss',
          qrDataUrl: 'data:image/png;base64,abc123',
          generatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
    });

    expect(result.summary).toContain(
      'Get our app: https://example.com/get-app/salon-bliss',
    );
  });

  it('omits the app-install line when app-install settings are absent', () => {
    const result = callHandleBusinessInfo({
      name: 'Salon Bliss',
      settings: {},
    });

    expect(result.summary).not.toContain('Get our app:');
  });

  it('still includes name/description/address/phone/email as before', () => {
    const result = callHandleBusinessInfo({
      name: 'Salon Bliss',
      description: 'A cozy neighborhood salon.',
      address: '123 Main St',
      phone: '555-1234',
      email: 'hello@salonbliss.com',
      settings: {},
    });

    expect(result.summary).toContain('Salon Bliss');
    expect(result.summary).toContain('A cozy neighborhood salon.');
    expect(result.summary).toContain('Address: 123 Main St');
    expect(result.summary).toContain('Phone: 555-1234');
    expect(result.summary).toContain('Email: hello@salonbliss.com');
  });

  it('handles missing settings entirely without throwing', () => {
    const result = callHandleBusinessInfo({ name: 'Salon Bliss' });

    expect(result.success).toBe(true);
    expect(result.summary).toContain('Privacy: policy v');
  });
});
