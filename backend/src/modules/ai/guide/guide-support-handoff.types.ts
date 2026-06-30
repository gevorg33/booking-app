import type { CommandSurface } from '../ai-command-registry.types.js';

/** Non-PII guide context for support escalation (ai-guide-1.7.2). */
export interface GuideSupportSnapshot {
  surface: CommandSurface;
  route?: string;
  topicId?: string;
  locale: string;
}

export interface GuideSupportTicketPayload {
  subject: string;
  body: string;
  tags: readonly string[];
}

export interface GuideSupportHandoff {
  action: 'create_support_ticket';
  label: string;
  snapshot: GuideSupportSnapshot;
  ticket: GuideSupportTicketPayload;
}

export interface GuideSupportHandoffContext {
  surface: CommandSurface;
  route?: string;
  topicId?: string;
  locale: string;
}
