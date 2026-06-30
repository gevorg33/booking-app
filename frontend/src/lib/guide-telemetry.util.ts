export type GuideTelemetrySurface = 'dashboard' | 'provider' | 'customer' | 'public';

export type GuideTelemetryEventName =
  | 'topic_opened'
  | 'step_completed'
  | 'handoff_to_action'
  | 'grounding_failure';

export interface GuideTelemetryClientEvent {
  event: GuideTelemetryEventName;
  surface: GuideTelemetrySurface;
  topicId?: string;
  route?: string;
  locale?: string;
  sessionId?: string;
  stepIndex?: number;
  totalSteps?: number;
  handoffAction?: string;
}

export function createGuideTelemetrySessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `guide-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function ingestGuideTelemetryEvents(
  postJson: (path: string, body: Record<string, unknown>) => Promise<unknown>,
  path: string,
  events: readonly GuideTelemetryClientEvent[],
): Promise<void> {
  if (events.length === 0) return;
  await postJson(path, { events });
}

export function buildGuideStepCompletedEvent(input: {
  surface: GuideTelemetrySurface;
  topicId?: string;
  route?: string;
  locale?: string;
  sessionId: string;
  stepIndex: number;
  totalSteps: number;
}): GuideTelemetryClientEvent {
  return {
    event: 'step_completed',
    ...input,
  };
}

export function buildGuideHandoffTelemetryEvent(input: {
  surface: GuideTelemetrySurface;
  topicId?: string;
  route?: string;
  locale?: string;
  sessionId: string;
  handoffAction: string;
  totalSteps?: number;
}): GuideTelemetryClientEvent {
  return {
    event: 'handoff_to_action',
    ...input,
  };
}
