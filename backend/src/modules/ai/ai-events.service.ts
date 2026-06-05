import { Injectable } from '@nestjs/common';
import { EventsGateway } from '../../websocket/events.gateway.js';

export type AiEventType =
  | 'ai.clarify'
  | 'ai.task.progress'
  | 'ai.task.completed'
  | 'ai.alert';

@Injectable()
export class AiEventsService {
  constructor(private eventsGateway: EventsGateway) {}

  emit(businessId: string, type: AiEventType, payload: Record<string, unknown>) {
    this.eventsGateway.emitBusinessEvent(businessId, type, payload);
  }

  emitClarify(businessId: string, payload: { action: string; summary: string; missing?: unknown[] }) {
    this.emit(businessId, 'ai.clarify', payload);
  }

  emitTaskProgress(
    businessId: string,
    payload: { taskId: string; action: string; status: string; summary?: string },
  ) {
    this.emit(businessId, 'ai.task.progress', payload);
  }

  emitTaskCompleted(
    businessId: string,
    payload: { taskId?: string; action: string; success: boolean; summary: string },
  ) {
    this.emit(businessId, 'ai.task.completed', payload);
  }

  /** In-app alert for conflicts, approvals, etc. (ai-d19). */
  emitAlert(
    businessId: string,
    payload: {
      alertType: 'conflict' | 'approval' | 'report';
      title: string;
      message: string;
      prompt?: string;
      taskId?: string;
      route?: string;
    },
  ) {
    this.emit(businessId, 'ai.alert', payload);
  }
}
