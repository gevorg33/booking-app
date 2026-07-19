import { handleExplainSupportInboxLogic } from './ai-explain-support-inbox.logic.js';

describe('ai-explain-support-inbox.logic (e2e-bug.139)', () => {
  it('explains that open support tickets cannot be listed via AI', async () => {
    const result = await handleExplainSupportInboxLogic(
      {},
      'biz-1',
      {},
      'Do I have any open support tickets?',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_support_inbox');
    expect(result.summary).toMatch(/cannot list|Zendesk/i);
    expect(result.summary).not.toMatch(/\d+\s+open support tickets/i);
    expect(result.details).toMatchObject({
      aspect: 'support_tickets',
      supported: false,
    });
  });

  it('explains that unread customer messages cannot be listed via AI', async () => {
    const result = await handleExplainSupportInboxLogic(
      {},
      'biz-1',
      {},
      'Do I have any unread customer messages?',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_support_inbox');
    expect(result.summary).toMatch(/cannot list unread customer messages/i);
    expect(result.details).toMatchObject({
      aspect: 'unread_customer_messages',
      supported: false,
    });
  });
});
