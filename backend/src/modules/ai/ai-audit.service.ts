import { Injectable } from '@nestjs/common';
import { EventStoreService } from '../../events/store/event-store.service.js';
import { EventType } from '../../events/event-types.js';

export interface AiAuditEntry {
  id: string;
  eventType: string;
  taskId: string;
  businessId?: string;
  userId?: string;
  approvedBy?: string;
  summary: string;
  planDiff?: unknown;
  payload: Record<string, unknown>;
  timestamp: string;
}

@Injectable()
export class AiAuditService {
  constructor(private eventStore: EventStoreService) {}

  async getAuditLog(businessId: string, limit = 50): Promise<AiAuditEntry[]> {
    const types = new Set<string>([
      EventType.AGENT_PLAN_GENERATED,
      EventType.AGENT_PLAN_VALIDATED,
      EventType.AGENT_PLAN_APPROVED,
      EventType.AGENT_PLAN_EXECUTING,
      EventType.AGENT_PLAN_COMPLETED,
      EventType.AGENT_PLAN_REJECTED,
      EventType.WORKFLOW_COMPLETED,
      EventType.WORKFLOW_FAILED,
    ]);

    const events = await this.eventStore.getEvents({
      businessId,
      limit: limit * 2,
    });

    return events
      .filter((e) => types.has(e.eventType))
      .slice(0, limit)
      .map((e) => ({
        id: e.id,
        eventType: e.eventType,
        taskId: e.aggregateId,
        businessId: e.businessId,
        userId: e.userId,
        approvedBy: (e.payload as any)?.approvedBy,
        summary: this.summarizeEvent(
          e.eventType,
          e.payload as Record<string, unknown>,
        ),
        planDiff: (e.payload as any)?.planDiff,
        payload: e.payload as Record<string, unknown>,
        timestamp: e.createdAt?.toISOString?.() ?? String(e.createdAt),
      }));
  }

  private summarizeEvent(
    eventType: string,
    payload: Record<string, unknown>,
  ): string {
    switch (eventType) {
      case EventType.AGENT_PLAN_APPROVED:
        return `Approved: ${payload.intent ?? 'plan'} (${payload.stepCount ?? 0} steps)`;
      case EventType.AGENT_PLAN_COMPLETED:
        return `Completed: ${payload.intent ?? 'plan'}`;
      case EventType.AGENT_PLAN_REJECTED:
        return 'Rejected by policy';
      case EventType.WORKFLOW_FAILED:
        return 'Workflow failed';
      default:
        return String(payload.intent ?? eventType);
    }
  }
}
