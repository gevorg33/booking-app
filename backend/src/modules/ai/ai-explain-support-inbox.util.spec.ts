import {
  isExplainSupportInboxPrompt,
  isSupportTicketStatusPrompt,
  isUnreadCustomerMessagesPrompt,
  rescueExplainSupportInboxIntent,
} from './ai-explain-support-inbox.util.js';
import { isListAgentTasksPrompt } from './ai-agent-ops.util.js';
import { isCreateSupportTicketPrompt } from './ai-integrations.util.js';

describe('ai-explain-support-inbox.util (e2e-bug.139)', () => {
  it.each([
    'Do I have any open support tickets?',
    'How many open Zendesk tickets do I have?',
    'Show open support tickets',
  ])('detects support ticket status: %s', (prompt) => {
    expect(isSupportTicketStatusPrompt(prompt)).toBe(true);
    expect(isExplainSupportInboxPrompt(prompt)).toBe(true);
    expect(isListAgentTasksPrompt(prompt)).toBe(false);
    expect(isCreateSupportTicketPrompt(prompt)).toBe(false);
    expect(rescueExplainSupportInboxIntent(prompt, 'list_agent_tasks')).toEqual(
      {
        action: 'explain_support_inbox',
        rescueReason: 'explain_support_inbox',
      },
    );
  });

  it.each([
    'Do I have any unread customer messages?',
    'Show unread messages from customers',
  ])('detects unread customer messages: %s', (prompt) => {
    expect(isUnreadCustomerMessagesPrompt(prompt)).toBe(true);
    expect(isExplainSupportInboxPrompt(prompt)).toBe(true);
    expect(isListAgentTasksPrompt(prompt)).toBe(false);
    expect(rescueExplainSupportInboxIntent(prompt, 'unknown')).toEqual({
      action: 'explain_support_inbox',
      rescueReason: 'explain_support_inbox',
    });
  });

  it('does not steal create ticket or real agent-task prompts', () => {
    expect(
      isExplainSupportInboxPrompt('Create a support ticket about billing'),
    ).toBe(false);
    expect(isCreateSupportTicketPrompt('Create a support ticket about billing')).toBe(
      true,
    );
    expect(isListAgentTasksPrompt('Show me pending AI agent tasks')).toBe(true);
    expect(
      rescueExplainSupportInboxIntent(
        'Show me pending AI agent tasks',
        'unknown',
      ),
    ).toBeNull();
  });
});
