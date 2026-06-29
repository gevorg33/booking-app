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
