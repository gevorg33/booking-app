import type { CommandResult } from './command-completion.types.js';
import {
  handleExplainBusinessTaxLogic,
  handleExplainStackedTaxLogic,
  handleExplainStripeTaxChargeLogic,
  handleLookupBookingTaxMetadataLogic,
  handleQuoteStaffBookingTaxLogic,
  handleSummarizeCustomerTaxPaidLogic,
  type BusinessTaxLogicDeps,
} from './ai-business-tax.logic.js';
import { parseExplainStripeTaxChargeFromPrompt } from './ai-stripe-tax-charge.util.js';
import { parseLookupBookingTaxMetadataFromPrompt } from './ai-lookup-booking-tax-metadata.util.js';
import { parseQuoteStaffBookingTaxFromPrompt } from './ai-quote-staff-booking-tax.util.js';
import { parseSummarizeCustomerTaxPaidFromPrompt } from './ai-summarize-customer-tax-paid.util.js';

export type BusinessTaxDispatchContext = {
  businessId: string;
  action: string;
  params: Record<string, unknown>;
  prompt: string;
};

export type BusinessTaxLogicDispatchHandler = (
  deps: BusinessTaxLogicDeps,
  ctx: BusinessTaxDispatchContext,
) => Promise<CommandResult>;

export function buildBusinessTaxLogicDispatchMap(): ReadonlyMap<
  string,
  BusinessTaxLogicDispatchHandler
> {
  const map = new Map<string, BusinessTaxLogicDispatchHandler>();

  map.set('explain_business_tax', async (deps, ctx) =>
    handleExplainBusinessTaxLogic(
      deps,
      ctx.businessId,
      { ...ctx.params, _prompt: ctx.prompt },
      ctx.prompt,
    ),
  );
  map.set('explain_stacked_tax', async (deps, ctx) =>
    handleExplainStackedTaxLogic(
      deps,
      ctx.businessId,
      { ...ctx.params, _prompt: ctx.prompt },
      ctx.prompt,
    ),
  );
  map.set('explain_stripe_tax_charge', async (deps, ctx) => {
    const parsed = parseExplainStripeTaxChargeFromPrompt(
      ctx.prompt,
      ctx.params,
    );
    return handleExplainStripeTaxChargeLogic(
      deps,
      ctx.businessId,
      parsed ? { ...ctx.params, ...parsed, _prompt: ctx.prompt } : ctx.params,
      ctx.prompt,
    );
  });
  map.set('quote_staff_booking_tax', async (deps, ctx) => {
    const parsed = parseQuoteStaffBookingTaxFromPrompt(
      ctx.prompt,
      ctx.params,
    );
    return handleQuoteStaffBookingTaxLogic(
      deps,
      ctx.businessId,
      parsed ? { ...ctx.params, ...parsed, _prompt: ctx.prompt } : ctx.params,
      ctx.prompt,
    );
  });
  map.set('summarize_customer_tax_paid', async (deps, ctx) => {
    const parsed = parseSummarizeCustomerTaxPaidFromPrompt(
      ctx.prompt,
      ctx.params,
    );
    return handleSummarizeCustomerTaxPaidLogic(
      deps,
      ctx.businessId,
      parsed ? { ...ctx.params, ...parsed, _prompt: ctx.prompt } : ctx.params,
      ctx.prompt,
    );
  });
  map.set('lookup_booking_tax_metadata', async (deps, ctx) => {
    const parsed = parseLookupBookingTaxMetadataFromPrompt(
      ctx.prompt,
      ctx.params,
    );
    return handleLookupBookingTaxMetadataLogic(
      deps,
      ctx.businessId,
      parsed ? { ...ctx.params, ...parsed, _prompt: ctx.prompt } : ctx.params,
      ctx.prompt,
    );
  });

  return map;
}

/** Registry-driven dispatch table for AiBusinessTaxService (ai-cmd-ext-0.5). */
export const BUSINESS_TAX_LOGIC_DISPATCH_MAP = buildBusinessTaxLogicDispatchMap();
