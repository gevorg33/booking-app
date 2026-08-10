/** e2e-bug.139 — support-ticket / unread-message status is not list_agent_tasks. */

export const EXPLAIN_SUPPORT_INBOX_INTENTS = ['explain_support_inbox'] as const;

export type ExplainSupportInboxIntent =
  (typeof EXPLAIN_SUPPORT_INBOX_INTENTS)[number];

export const EXPLAIN_SUPPORT_INBOX_CLASSIFIER_RULES = `- explain_support_inbox: READ — honest status for Zendesk support tickets or unread customer inbox messages. Triggers: "Do I have any open support tickets?", "How many open Zendesk tickets?", "Do I have any unread customer messages?". There is no AI list/count of Zendesk tickets or inbox unread yet — answer that clearly and point to Integrations → Zendesk / create_support_ticket. NEVER list_agent_tasks (AI agent task queue ≠ support tickets or customer messages). NOT create_support_ticket (opens a new ticket).
  - "Do I have any open support tickets?" → explain_support_inbox
  - "Do I have any unread customer messages?" → explain_support_inbox`;

export function isExplainSupportInboxIntent(
  action: string,
): action is ExplainSupportInboxIntent {
  return (EXPLAIN_SUPPORT_INBOX_INTENTS as readonly string[]).includes(action);
}

/** Open/list Zendesk support tickets (status), not create. */
export function isSupportTicketStatusPrompt(prompt: string): boolean {
  if (
    /\b(create|submit|file|open\s+a|raise|file)\b/i.test(prompt) &&
    !/\b(do\s+i\s+have|any|how\s+many|list|show|status)\b/i.test(prompt)
  ) {
    return false;
  }
  return (
    /\b(support\s+tickets?|zendesk\s+tickets?)\b/i.test(prompt) &&
    /\b(open|any|list|show|have|pending|unread|status|how\s+many)\b/i.test(
      prompt,
    )
  );
}

/** Unread customer messages / inbox — not agent tasks. */
export function isUnreadCustomerMessagesPrompt(prompt: string): boolean {
  return (
    (/\bunread\b/i.test(prompt) &&
      /\b(customer\s+)?messages?\b/i.test(prompt)) ||
    (/\bcustomer\s+messages?\b/i.test(prompt) &&
      /\b(any|have|show|list|unread|pending)\b/i.test(prompt))
  );
}

export function isExplainSupportInboxPrompt(prompt: string): boolean {
  return (
    isSupportTicketStatusPrompt(prompt) ||
    isUnreadCustomerMessagesPrompt(prompt)
  );
}

export function rescueExplainSupportInboxIntent(
  prompt: string,
  action: string,
): { action: ExplainSupportInboxIntent; rescueReason: string } | null {
  if (isExplainSupportInboxIntent(action)) return null;
  if (!isExplainSupportInboxPrompt(prompt)) return null;
  return {
    action: 'explain_support_inbox',
    rescueReason: 'explain_support_inbox',
  };
}
