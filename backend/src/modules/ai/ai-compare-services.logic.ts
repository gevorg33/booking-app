import { resolveEntity } from './ai-entity-resolution.util.js';
import type { Service } from '../service/entities/service.entity.js';
import type { CommandResult } from './command-completion.types.js';
import {
  formatInclusiveTaxBadge,
  readBusinessTaxSettings,
} from '../../common/utils/business-tax.util.js';
import { formatCatalogServicePriceLabel } from './ai-budget-list-services.logic.js';
import {
  enrichCompareServicesParamsFromPrompt,
  extractCompareServiceNamesFromPrompt,
} from './ai-compare-services.util.js';
import type { PaymentsLogicDeps } from './ai-payments.logic.js';

/**
 * tech-debt B7 / e2e-bug.367 — this local copy now refuses a tie.
 *
 * §187 filed the four remaining re-parsers as blocked on one decision: "may
 * these surfaces ask a clarifying question", on the grounds that every copy
 * *guesses* while `EntityResolutionService` *asks*, making each migration a
 * contract change for its callers.
 *
 * Checked, and this caller needs no contract change: `resolveServicesForCompare` collects unresolved
 * names into `missing[]`, and the summary reports *"Could not find catalog
 * matches for: X. Name services from the menu."* — a refusal channel that
 * already existed.
 *
 * So the tie is detected with the shared `resolveEntity` and answered with
 * `undefined`, which the existing path already handles. Acceptance is otherwise
 * untouched — the original tiers still run for every non-tied name — so this
 * can only refuse a name that previously resolved to an arbitrary one of
 * several equally good matches.
 */
function resolveServiceByName(
  services: readonly Service[],
  name: string,
): Service | undefined {
  const needle = name.trim().toLowerCase();
  if (!needle) return undefined;
  if (
    resolveEntity(services, name, {
      entityLabel: 'service',
      threshold: 0,
    }).status === 'ambiguous'
  ) {
    return undefined;
  }
  return (
    services.find((entry) => entry.name.toLowerCase() === needle) ??
    services.find((entry) => entry.name.toLowerCase().includes(needle)) ??
    services.find((entry) => needle.includes(entry.name.toLowerCase()))
  );
}

function resolveServicesForCompare(
  services: readonly Service[],
  names: string[],
): { resolved: Service[]; missing: string[] } {
  const resolved: Service[] = [];
  const missing: string[] = [];
  for (const name of names) {
    const match = resolveServiceByName(services, name);
    if (!match) {
      missing.push(name);
      continue;
    }
    if (!resolved.some((entry) => entry.id === match.id)) {
      resolved.push(match);
    }
  }
  return { resolved, missing };
}

export function buildCompareServicesSummary(
  services: readonly Service[],
  businessSettings?: Record<string, unknown>,
): {
  summary: string;
  rows: Array<{
    serviceId: string;
    serviceName: string;
    price: number;
    currency: string;
    durationMinutes: number;
    priceLabel: string;
    taxBadge: string | null;
  }>;
  verdict: string | null;
} {
  const tax = readBusinessTaxSettings(businessSettings);
  const taxBadge = formatInclusiveTaxBadge(tax);

  const rows = services.map((service) => {
    const price = Number(service.price);
    const currency = service.currency ?? 'USD';
    const priceLabel = formatCatalogServicePriceLabel(price, currency);
    return {
      serviceId: service.id,
      serviceName: service.name,
      price,
      currency,
      durationMinutes: service.durationMinutes ?? 0,
      priceLabel,
      taxBadge,
    };
  });

  const lineSummaries = rows.map(
    (row) =>
      `${row.serviceName}: ${row.durationMinutes} min · ${row.priceLabel}${
        row.taxBadge ? ` (${row.taxBadge})` : ''
      }`,
  );

  let verdict: string | null = null;
  if (rows.length === 2) {
    const [left, right] = rows;
    const priceDelta = left.price - right.price;
    const durationDelta = left.durationMinutes - right.durationMinutes;
    const pricePart =
      Math.abs(priceDelta) < 0.01
        ? `${left.serviceName} and ${right.serviceName} are listed at the same price`
        : priceDelta < 0
          ? `${left.serviceName} is cheaper (${left.priceLabel} vs ${right.priceLabel})`
          : `${right.serviceName} is cheaper (${right.priceLabel} vs ${left.priceLabel})`;
    const durationPart =
      durationDelta === 0
        ? 'same duration'
        : durationDelta < 0
          ? `${left.serviceName} is shorter (${left.durationMinutes} min vs ${right.durationMinutes} min)`
          : `${right.serviceName} is shorter (${right.durationMinutes} min vs ${left.durationMinutes} min)`;
    verdict = `${pricePart}; ${durationPart}.`;
  }

  const summary = [lineSummaries.join(' · '), verdict]
    .filter(Boolean)
    .join(' ');

  return { summary, rows, verdict };
}

export async function handleCompareServicesLogic(
  deps: PaymentsLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt = '',
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return {
      success: false,
      action: 'compare_services',
      summary: 'Business not found.',
      details: {},
    };
  }

  const textPrompt = prompt || String(params._prompt ?? '');
  const enrichedParams = enrichCompareServicesParamsFromPrompt(
    params,
    textPrompt,
  );
  const requestedNames = Array.isArray(enrichedParams.serviceNames)
    ? (enrichedParams.serviceNames as string[])
    : extractCompareServiceNamesFromPrompt(textPrompt);

  if (requestedNames.length < 2) {
    return {
      success: false,
      action: 'compare_services',
      summary:
        'Name at least two services to compare (for example haircut vs blowdry).',
      details: {
        clarify: true,
        missing: ['serviceNames'],
      },
    };
  }

  const catalogServices = await deps.serviceRepo.find({
    where: { businessId, isActive: true },
  });
  const { resolved, missing } = resolveServicesForCompare(
    catalogServices,
    requestedNames,
  );

  if (resolved.length < 2) {
    return {
      success: false,
      action: 'compare_services',
      summary:
        missing.length > 0
          ? `Could not find catalog matches for: ${missing.join(', ')}. Name services from the menu.`
          : 'Could not find two catalog services to compare.',
      details: {
        clarify: true,
        missing: ['serviceNames'],
        missingNames: missing,
      },
    };
  }

  const comparison = buildCompareServicesSummary(
    resolved,
    business.settings as Record<string, unknown> | undefined,
  );

  return {
    success: true,
    action: 'compare_services',
    summary: comparison.summary,
    details: {
      services: comparison.rows,
      verdict: comparison.verdict,
      serviceIds: resolved.map((entry) => entry.id),
      serviceNames: resolved.map((entry) => entry.name),
      navigate: {
        path: 'services',
        query:
          resolved.length === 1
            ? { serviceId: resolved[0].id }
            : { serviceIds: resolved.map((entry) => entry.id).join(',') },
      },
    },
  };
}
