import { Injectable, Logger } from '@nestjs/common';
import { LlmService } from '../../engine/agent/llm.service.js';
import { todayDisplay } from '../../common/utils/date-format.util.js';

export interface DecomposedIntent {
  action: string;
  params: Record<string, any>;
  reasoning: string;
}

const COMPOUND_MARKERS =
  /\band then\b|\bthen\b|\balso\b|\bafter that\b|\bfollowed by\b|;\s*|\band\b.*\b(block|fill|apply|cancel|reschedule|optimize|setup)\b/i;

const DECOMPOSE_SCHEMA = `Split a compound operational command into ordered sub-intents.
Return JSON:
{
  "intents": [
    { "action": "<same action names as dashboard AI>", "params": { ... }, "reasoning": "..." }
  ]
}

Allowed actions: create_booking, cancel_bookings, bulk_smart_cancel, fill_slot_from_waitlist, list_bookings, show_appointments, check_availability, reschedule_booking, fill_unused_slots, list_schedule_gaps, apply_schedule, block_schedule, setup_week_schedule, optimize_schedule, resolve_conflicts, reassign_cancelled, summarize_utilization, summarize_customers, analyze_appointments, assign_employee_services.

Rules:
- Preserve order of operations.
- Inherit shared params (date, employeeName, templateName, timeFrom, timeTo) across sub-intents when implied.
- Use bulk_smart_cancel when cancel + notify/waitlist/rebook customers.
- Use setup_week_schedule for apply template + fill gaps combo.
- Max 4 sub-intents.`;

@Injectable()
export class IntentDecompositionService {
  private readonly logger = new Logger(IntentDecompositionService.name);

  constructor(private llm: LlmService) {}

  isCompoundPrompt(prompt: string): boolean {
    const trimmed = prompt.trim();
    if (trimmed.length < 12) return false;
    return COMPOUND_MARKERS.test(trimmed);
  }

  async decompose(
    businessId: string,
    userId: string | undefined,
    prompt: string,
  ): Promise<DecomposedIntent[]> {
    if (!this.isCompoundPrompt(prompt)) return [];

    try {
      const result = await this.llm.completeJson<{ intents: DecomposedIntent[] }>(
        businessId,
        `${DECOMPOSE_SCHEMA}\n\nCurrent date: ${todayDisplay()} (DD_MM_YYYY)`,
        prompt,
        {
          surface: 'dashboard',
          operation: 'decompose_intent',
          actorType: 'owner',
          userId,
        },
        0.1,
      );

      const intents = (result?.intents ?? []).filter((i) => i?.action && i.action !== 'unknown');
      if (intents.length <= 1) return [];
      this.logger.log(`Decomposed into ${intents.length} sub-intent(s)`);
      return intents.slice(0, 4);
    } catch (error: any) {
      this.logger.warn(`Intent decomposition failed: ${error.message}`);
      return [];
    }
  }
}
