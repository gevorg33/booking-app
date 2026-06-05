import type { AiAlertPayload } from '@/lib/use-ai-events';

export function parseAiAlertPayload(data: Record<string, unknown>): AiAlertPayload | null {
  const alertType = data.alertType;
  const title = data.title;
  const message = data.message;
  if (
    alertType !== 'conflict' &&
    alertType !== 'approval' &&
    alertType !== 'report'
  ) {
    return null;
  }
  if (typeof title !== 'string' || typeof message !== 'string') return null;
  return {
    alertType,
    title,
    message,
    prompt: typeof data.prompt === 'string' ? data.prompt : undefined,
    taskId: typeof data.taskId === 'string' ? data.taskId : undefined,
    route: typeof data.route === 'string' ? data.route : undefined,
  };
}
