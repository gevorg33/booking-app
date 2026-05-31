import { IntegrationsDocsService } from './integrations-docs.service.js';
import { EventType } from '../../events/event-types.js';

describe('IntegrationsDocsService', () => {
  const webhooksService = {
    getEventOptions: jest.fn().mockReturnValue({
      events: [EventType.BOOKING_CREATED, EventType.PAYMENT_RECEIVED, EventType.REVIEW_RECEIVED],
    }),
  };
  const config = { get: jest.fn().mockReturnValue('https://api.example.com') };

  const service = new IntegrationsDocsService(config as any, webhooksService as any);

  it('builds API docs with quick start and webhook verification', () => {
    const docs = service.buildDocs('biz-1');
    expect(docs.baseUrl).toBe('https://api.example.com');
    expect(docs.webhooks.events).toContain(EventType.REVIEW_RECEIVED);
    expect(docs.quickStart.webhook).toHaveLength(3);
    expect(docs.quickStart.zapier[0].title).toBe('Catch Hook');
    expect(docs.examples.listBookingsCurl).toContain('/v1/bookings');
    expect(docs.webhooks.verifyExample).toContain('createHmac');
  });

  it('falls back to localhost when API_PUBLIC_URL is unset', () => {
    config.get.mockReturnValue(undefined);
    const docs = service.buildDocs('biz-1');
    expect(docs.baseUrl).toBe('http://localhost:3001');
  });
});
