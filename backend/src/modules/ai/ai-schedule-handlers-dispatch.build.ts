import type { CommandResult } from './command-completion.types.js';
import type { AiScheduleHandlersService } from './ai-schedule-handlers.service.js';
import type { Employee } from '../employee/entities/employee.entity.js';
import type { Service } from '../service/entities/service.entity.js';

export type ScheduleHandlersDispatchContext = {
  businessId: string;
  action: string;
  params: Record<string, any>;
  prompt: string;
  employees: Employee[];
  services: Service[];
  userId?: string;
};

export type ScheduleHandlersDispatchHandler = (
  service: AiScheduleHandlersService,
  ctx: ScheduleHandlersDispatchContext,
) => Promise<CommandResult>;

export function buildScheduleHandlersDispatchMap(): ReadonlyMap<
  string,
  ScheduleHandlersDispatchHandler
> {
  const map = new Map<string, ScheduleHandlersDispatchHandler>();

  map.set('create_schedule_template', async (service, ctx) =>
    service.handleCreateScheduleTemplate(
      ctx.businessId,
      ctx.prompt,
      ctx.params,
      ctx.employees,
      ctx.services,
      ctx.userId,
    ),
  );
  map.set('update_schedule_template', async (service, ctx) =>
    service.handleUpdateScheduleTemplate(
      ctx.businessId,
      ctx.params,
      ctx.userId,
    ),
  );
  map.set('delete_schedule_templates', async (service, ctx) =>
    service.handleDeleteScheduleTemplates(
      ctx.businessId,
      ctx.params,
      ctx.userId,
    ),
  );
  map.set('duplicate_schedule_template', async (service, ctx) =>
    service.handleDuplicateScheduleTemplate(
      ctx.businessId,
      ctx.params,
      ctx.userId,
    ),
  );
  map.set('fill_unused_slots', async (service, ctx) =>
    service.handleFillScheduleGaps(
      ctx.businessId,
      ctx.prompt,
      ctx.params,
      ctx.employees,
      ctx.services,
      ctx.userId,
    ),
  );
  map.set('list_schedule_gaps', async (service, ctx) =>
    service.handleListScheduleGaps(
      ctx.businessId,
      ctx.prompt,
      ctx.params,
      ctx.employees,
    ),
  );
  map.set('apply_schedule', async (service, ctx) =>
    service.handleApplySchedule(
      ctx.businessId,
      ctx.prompt,
      ctx.params,
      ctx.employees,
      ctx.userId,
    ),
  );
  map.set('block_schedule', async (service, ctx) =>
    service.handleBlockSchedule(
      ctx.businessId,
      ctx.prompt,
      ctx.params,
      ctx.employees,
      ctx.userId,
    ),
  );
  map.set('delete_schedule_block', async (service, ctx) =>
    service.handleDeleteScheduleBlock(
      ctx.businessId,
      ctx.prompt,
      ctx.params,
      ctx.employees,
      ctx.userId,
    ),
  );
  map.set('list_schedule_blocks', async (service, ctx) =>
    service.handleListScheduleBlocks(ctx.businessId, ctx.params, ctx.employees),
  );
  map.set('get_provider_calendar', async (service, ctx) =>
    service.handleGetProviderCalendar(
      ctx.businessId,
      ctx.prompt,
      ctx.params,
      ctx.employees,
    ),
  );
  map.set('apply_and_fill', async (service, ctx) =>
    service.handleApplyAndFill(
      ctx.businessId,
      ctx.prompt,
      ctx.params,
      ctx.employees,
      ctx.services,
      ctx.userId,
    ),
  );
  map.set('clear_schedule', async (service, ctx) =>
    service.handleClearSchedule(
      ctx.businessId,
      ctx.prompt,
      ctx.params,
      ctx.employees,
      ctx.userId,
    ),
  );
  map.set('create_direct_schedule', async (service, ctx) =>
    service.handleCreateDirectSchedule(
      ctx.businessId,
      ctx.prompt,
      ctx.params,
      ctx.employees,
      ctx.services,
      ctx.userId,
    ),
  );
  map.set('setup_week_schedule', async (service, ctx) =>
    service.handleTemplateCascade(
      ctx.businessId,
      ctx.prompt,
      ctx.params,
      ctx.employees,
      ctx.services,
      ctx.userId,
    ),
  );

  return map;
}

/** Registry-driven dispatch table for AiScheduleHandlersService (ai-cmd-ext-0.5). */
export const SCHEDULE_HANDLERS_DISPATCH_MAP =
  buildScheduleHandlersDispatchMap();
