import type { CommandResult } from './command-completion.types.js';
import { isUnreadCustomerMessagesPrompt } from './ai-explain-support-inbox.util.js';

const NAVIGATE_ZENDESK = { path: '/dashboard/integrations' };

export async function handleExplainSupportInboxLogic(
  _deps: unknown,
  _businessId: string,
  _params: Record<string, unknown> = {},
  prompt = '',
): Promise<CommandResult> {
  if (isUnreadCustomerMessagesPrompt(prompt)) {
    return {
      success: true,
      action: 'explain_support_inbox',
      summary:
        'I cannot list unread customer messages from the AI assistant yet. Check your messaging inbox in the dashboard — this is not the same as the AI agent task queue.',
      details: {
        aspect: 'unread_customer_messages',
        supported: false,
        navigate: NAVIGATE_ZENDESK,
      },
    };
  }

  return {
    success: true,
    action: 'explain_support_inbox',
    summary:
      'I cannot list or count open Zendesk support tickets from the AI assistant yet. Open Integrations → Zendesk to view your queue, or ask me to create a new support ticket.',
    details: {
      aspect: 'support_tickets',
      supported: false,
      navigate: NAVIGATE_ZENDESK,
    },
  };
}
