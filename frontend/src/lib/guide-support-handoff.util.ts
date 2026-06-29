export interface GuideSupportSnapshot {
  surface: 'dashboard' | 'provider' | 'customer' | 'public';
  route?: string;
  topicId?: string;
  locale: string;
}

export interface GuideSupportHandoff {
  action: 'create_support_ticket';
  label: string;
  snapshot: GuideSupportSnapshot;
  ticket: {
    subject: string;
    body: string;
    tags: readonly string[];
  };
}

export interface SubmitGuideSupportHandoffInput {
  businessId: string;
  handoff: GuideSupportHandoff;
  requesterEmail?: string;
  requesterName?: string;
}

export interface SubmitGuideSupportHandoffResult {
  url?: string;
  ticketId?: number | string;
}

export async function submitGuideSupportHandoff(
  postJson: (path: string, body: Record<string, unknown>) => Promise<unknown>,
  input: SubmitGuideSupportHandoffInput,
): Promise<SubmitGuideSupportHandoffResult> {
  const { businessId, handoff, requesterEmail, requesterName } = input;
  const response = await postJson(
    `/businesses/${businessId}/integrations/zendesk/support-ticket`,
    {
      subject: handoff.ticket.subject,
      body: handoff.ticket.body,
      tags: [...handoff.ticket.tags],
      guideSnapshot: handoff.snapshot,
      ...(requesterEmail ? { requesterEmail } : {}),
      ...(requesterName ? { requesterName } : {}),
    },
  );
  const row = (response as { data?: SubmitGuideSupportHandoffResult })?.data ?? response;
  return row as SubmitGuideSupportHandoffResult;
}

export function openZendeskMessengerWidget(): boolean {
  if (typeof window === 'undefined') return false;
  const zE = (window as Window & { zE?: (...args: unknown[]) => void }).zE;
  if (typeof zE !== 'function') return false;
  try {
    zE('messenger', 'open');
    return true;
  } catch {
    return false;
  }
}
