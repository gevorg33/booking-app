import type { CommandResult } from './command-completion.types.js';
import {
  handleCreateTestOrderLogic,
  handleListTestOrdersLogic,
  type ClinicTestOrderLogicDeps,
} from './ai-clinic-test-order.logic.js';

export type ClinicTestOrderDispatchContext = {
  businessId: string;
  action: string;
  params: Record<string, unknown>;
  prompt?: string;
  userId: string;
  confirmed: boolean;
};

export type ClinicTestOrderLogicDispatchHandler = (
  deps: ClinicTestOrderLogicDeps,
  ctx: ClinicTestOrderDispatchContext,
) => Promise<CommandResult>;

export function buildClinicTestOrderLogicDispatchMap(): ReadonlyMap<
  string,
  ClinicTestOrderLogicDispatchHandler
> {
  const map = new Map<string, ClinicTestOrderLogicDispatchHandler>();

  const createTestOrderHandler: ClinicTestOrderLogicDispatchHandler = async (
    deps,
    ctx,
  ) =>
    handleCreateTestOrderLogic(
      deps,
      ctx.businessId,
      ctx.userId,
      { ...ctx.params, _prompt: ctx.prompt },
      ctx.prompt,
      ctx.confirmed,
    );
  // 'create_test_order' is the canonical name (handleCreateTestOrderLogic always
  // returns action: 'create_test_order' regardless of which key dispatched it);
  // 'create_catalog_test_order' is a documented classifier-rule alias of it
  // (ai-clinic-lab-booking.fixtures.ts) — both route to the exact same handler.
  map.set('create_test_order', createTestOrderHandler);
  map.set('create_catalog_test_order', createTestOrderHandler);
  map.set('list_test_orders', async (deps, ctx) =>
    handleListTestOrdersLogic(
      deps,
      ctx.businessId,
      ctx.userId,
      { ...ctx.params, _prompt: ctx.prompt },
      ctx.prompt,
    ),
  );

  return map;
}

/** Registry-driven dispatch table for AiClinicTestOrderService (ai-cmd-ext-0.5). */
export const CLINIC_TEST_ORDER_LOGIC_DISPATCH_MAP =
  buildClinicTestOrderLogicDispatchMap();
