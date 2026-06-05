export type AiAlertType = 'conflict' | 'approval' | 'report';

export interface AiInAppAlert {
  id: string;
  alertType: AiAlertType;
  title: string;
  message: string;
  prompt?: string;
  taskId?: string;
  route?: string;
  read: boolean;
  createdAt: number;
}

const MAX_ALERTS = 30;

export function createAiAlert(payload: {
  alertType: AiAlertType;
  title: string;
  message: string;
  prompt?: string;
  taskId?: string;
  route?: string;
}): AiInAppAlert {
  return {
    id: `${payload.alertType}-${payload.taskId ?? Date.now()}`,
    read: false,
    createdAt: Date.now(),
    ...payload,
  };
}

export function pushAiAlert(
  alerts: AiInAppAlert[],
  incoming: AiInAppAlert,
): AiInAppAlert[] {
  const withoutDup = alerts.filter((a) => a.id !== incoming.id);
  return [incoming, ...withoutDup].slice(0, MAX_ALERTS);
}

export function markAlertRead(alerts: AiInAppAlert[], id: string): AiInAppAlert[] {
  return alerts.map((a) => (a.id === id ? { ...a, read: true } : a));
}

export function unreadAlertCount(alerts: AiInAppAlert[]): number {
  return alerts.filter((a) => !a.read).length;
}
