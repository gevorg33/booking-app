import type { CommandResult } from './command-completion.types.js';
import { handleExplainCheckoutTotalLogic } from './ai-payments.logic.js';
import type { PaymentsLogicDeps } from './ai-payments.logic.js';

export async function handleExplainAmountDueNowLogic(
  deps: PaymentsLogicDeps,
  businessId: string,
  params: Record<string, any> = {},
  prompt = '',
  catalogContext?: Record<string, unknown>,
): Promise<CommandResult> {
  const textPrompt = prompt || String(params._prompt ?? '');
  const result = await handleExplainCheckoutTotalLogic(
    deps,
    businessId,
    { ...params, _prompt: textPrompt },
    catalogContext,
  );
  return {
    ...result,
    action: 'explain_amount_due_now',
  };
}
