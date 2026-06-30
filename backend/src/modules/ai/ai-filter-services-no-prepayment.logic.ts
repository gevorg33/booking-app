import { PrepaymentMode } from '../service/entities/service.entity.js';
import type { Service } from '../service/entities/service.entity.js';
import type { CommandResult } from './command-completion.types.js';
import {
  formatInclusiveTaxBadge,
  readBusinessTaxSettings,
} from '../../common/utils/business-tax.util.js';
import { formatCatalogServicePriceLabel } from './ai-budget-list-services.logic.js';
import {
  filterServicesByListServicesPaymentPolicy,
  buildListServicesPaymentFilterHeader,
} from './ai-list-services-payment-filters.util.js';
import {
  enrichFilterServicesNoPrepaymentParamsFromPrompt,
  extractNoPrepaymentServiceCategoryFromPrompt,
} from './ai-filter-services-no-prepayment.util.js';
import type { PaymentsLogicDeps } from './ai-payments.logic.js';

function resolveServicesByCategory(
  services: readonly Service[],
  serviceCategory?: string | null,
): Service[] {
  if (!serviceCategory?.trim()) return [...services];
  const needle = serviceCategory.trim().toLowerCase();
  const filtered = services.filter((service) => {
    const name = service.name.toLowerCase();
    const category = service.category?.name?.toLowerCase() ?? '';
    return name.includes(needle) || category.includes(needle);
  });
  return filtered.length > 0 ? filtered : [...services];
}

export function buildFilterServicesNoPrepaymentSummary(input: {
  services: ReadonlyArray<{
    name: string;
    priceLabel: string;
    durationMinutes: number;
    taxBadge: string | null;
  }>;
  header: string;
}): string {
  if (input.services.length === 0) {
    return `No ${input.header.toLowerCase()} right now.`;
  }
  const lines = input.services.map(
    (service) =>
      `${service.name}: ${service.durationMinutes} min · ${service.priceLabel}${
        service.taxBadge ? ` (${service.taxBadge})` : ''
      }`,
  );
  return `${input.header}: ${lines.join(' · ')}.`;
}

export async function handleFilterServicesNoPrepaymentLogic(
  deps: PaymentsLogicDeps,
  businessId: string,
  params: Record<string, any> = {},
  prompt = '',
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return {
      success: false,
      action: 'filter_services_no_prepayment',
      summary: 'Business not found.',
      details: {},
    };
  }

  const textPrompt = prompt || String(params._prompt ?? '');
  const enriched = enrichFilterServicesNoPrepaymentParamsFromPrompt(
    params,
    textPrompt,
  );
  const serviceCategory =
    (enriched.serviceCategory as string | undefined) ??
    extractNoPrepaymentServiceCategoryFromPrompt(textPrompt) ??
    null;

  const catalogServices = await deps.serviceRepo.find({
    where: { businessId, isActive: true },
    relations: { category: true },
    order: { name: 'ASC' },
  });

  const categoryMatched = resolveServicesByCategory(
    catalogServices,
    serviceCategory,
  );
  const filtered = filterServicesByListServicesPaymentPolicy(categoryMatched, {
    prepaymentMode: 'none',
    onlinePaymentEnabled: false,
  });

  const tax = readBusinessTaxSettings(
    business.settings as Record<string, unknown> | undefined,
  );
  const taxBadge = formatInclusiveTaxBadge(tax);
  const rows = filtered.map((service) => ({
    serviceId: service.id,
    serviceName: service.name,
    price: Number(service.price),
    currency: service.currency ?? 'USD',
    durationMinutes: service.durationMinutes ?? 0,
    priceLabel: formatCatalogServicePriceLabel(
      Number(service.price),
      service.currency ?? 'USD',
    ),
    taxBadge,
    prepaymentMode: service.prepaymentMode ?? PrepaymentMode.NONE,
  }));

  const header = buildListServicesPaymentFilterHeader({
    prepaymentMode: 'none',
    onlinePaymentEnabled: false,
  });
  const summary = buildFilterServicesNoPrepaymentSummary({
    services: rows.map((row) => ({
      name: row.serviceName,
      priceLabel: row.priceLabel,
      durationMinutes: row.durationMinutes,
      taxBadge: row.taxBadge,
    })),
    header,
  });

  if (rows.length === 0) {
    return {
      success: false,
      action: 'filter_services_no_prepayment',
      summary,
      details: {
        prepaymentMode: 'none',
        onlinePaymentEnabled: false,
        ...(serviceCategory ? { serviceCategory } : {}),
        services: [],
        navigate: { path: 'services', query: {} },
      },
    };
  }

  return {
    success: true,
    action: 'filter_services_no_prepayment',
    summary,
    details: {
      prepaymentMode: 'none',
      onlinePaymentEnabled: false,
      ...(serviceCategory ? { serviceCategory } : {}),
      services: rows,
      serviceIds: rows.map((row) => row.serviceId),
      serviceNames: rows.map((row) => row.serviceName),
      navigate: {
        path: 'services',
        query:
          rows.length === 1
            ? { serviceId: rows[0]!.serviceId, prepaymentMode: 'none' }
            : {
                serviceIds: rows.map((row) => row.serviceId).join(','),
                prepaymentMode: 'none',
              },
      },
    },
  };
}
