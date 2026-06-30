import type { Service } from '../service/entities/service.entity.js';
import type { CommandResult } from './command-completion.types.js';
import {
  enrichPrepaymentParamsFromCatalogContext,
  needsCatalogServiceClarify,
} from './ai-explain-prepayment.util.js';
import {
  buildServicePriceExplainCopy,
  enrichExplainServicePriceParamsFromPrompt,
} from './ai-explain-service-price.util.js';
import type { PaymentsLogicDeps } from './ai-payments.logic.js';

async function resolveServiceForPrice(
  deps: PaymentsLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<Service | undefined> {
  const services = await deps.serviceRepo.find({
    where: { businessId, isActive: true },
  });

  if (params.serviceId) {
    return services.find((entry) => entry.id === params.serviceId);
  }

  const name = (params.serviceName as string | undefined)?.trim();
  if (!name) return undefined;

  const needle = name.toLowerCase();
  return (
    services.find((entry) => entry.name.toLowerCase() === needle) ??
    services.find((entry) => entry.name.toLowerCase().includes(needle))
  );
}

export async function handleExplainServicePriceLogic(
  deps: PaymentsLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt = '',
  catalogContext?: Record<string, unknown>,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return {
      success: false,
      action: 'explain_service_price',
      summary: 'Business not found.',
      details: {},
    };
  }

  const textPrompt = prompt || String(params._prompt ?? '');
  const withCatalog = enrichPrepaymentParamsFromCatalogContext(
    params,
    textPrompt,
    catalogContext,
  );
  const enrichedParams = enrichExplainServicePriceParamsFromPrompt(
    withCatalog,
    textPrompt,
  );

  if (needsCatalogServiceClarify(textPrompt, enrichedParams)) {
    return {
      success: false,
      action: 'explain_service_price',
      summary:
        'Select a service first, or tell me which service price to explain.',
      details: {
        clarify: true,
        missing: ['serviceName'],
      },
    };
  }

  const service = await resolveServiceForPrice(
    deps,
    businessId,
    enrichedParams,
  );
  if (!service) {
    return {
      success: false,
      action: 'explain_service_price',
      summary: 'Specify which service price to explain.',
      details: {
        clarify: true,
        missing: ['serviceName'],
      },
    };
  }

  const copy = buildServicePriceExplainCopy(
    service,
    business.settings as Record<string, unknown> | undefined,
    { prompt: textPrompt },
  );

  return {
    success: true,
    action: 'explain_service_price',
    summary: copy.summary,
    details: copy,
  };
}
