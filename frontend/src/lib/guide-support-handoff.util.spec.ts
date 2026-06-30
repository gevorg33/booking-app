import { describe, expect, it, vi } from 'vitest';
import {
  openZendeskMessengerWidget,
  submitGuideSupportHandoff,
  type GuideSupportHandoff,
} from './guide-support-handoff.util';

const sampleHandoff: GuideSupportHandoff = {
  action: 'create_support_ticket',
  label: 'Still stuck?',
  snapshot: {
    surface: 'dashboard',
    route: '/dashboard/schedule',
    topicId: 'dashboard.core.schedule',
    locale: 'en',
  },
  ticket: {
    subject: 'Product guide help — dashboard.core.schedule (dashboard)',
    body: 'Product guide support handoff (no PII)\n\nSurface: dashboard',
    tags: ['product-guide', 'guide-dashboard'],
  },
};

describe('guide-support-handoff.util (ai-guide-1.7.2)', () => {
  it('submits ticket payload with guideSnapshot and no prompt', async () => {
    const postJson = vi.fn(async () => ({ ticketId: 42, url: 'https://acme.zendesk.com/agent/tickets/42' }));
    const result = await submitGuideSupportHandoff(postJson, {
      businessId: 'biz-1',
      handoff: sampleHandoff,
      requesterEmail: 'owner@example.com',
    });
    expect(postJson).toHaveBeenCalledWith(
      '/businesses/biz-1/integrations/zendesk/support-ticket',
      expect.objectContaining({
        subject: sampleHandoff.ticket.subject,
        body: sampleHandoff.ticket.body,
        guideSnapshot: sampleHandoff.snapshot,
        requesterEmail: 'owner@example.com',
      }),
    );
    expect(result.ticketId).toBe(42);
  });

  it('openZendeskMessengerWidget returns false when widget is unavailable', () => {
    expect(openZendeskMessengerWidget()).toBe(false);
  });
});
