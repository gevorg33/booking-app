import type { Repository } from 'typeorm';
import type { Booking } from '../booking/entities/booking.entity.js';
import type { Business } from '../business/entities/business.entity.js';
import type { Service } from '../service/entities/service.entity.js';
import { resolveBookingPaymentSummary } from '../booking/booking-payment-summary.util.js';
import type { BookingPaymentSummary } from '../booking/booking-payment-summary.util.js';
import type { CommandResult } from './command-completion.types.js';
import { mergeBusinessSettings } from '../../common/utils/merge-business-settings.util.js';
import {
  applyServiceTaxRateToMetadata,
  applyTaxToCheckoutAmount,
  assertBusinessTaxSettings,
  businessTaxIsActive,
  calculateStackedTaxBreakdown,
  calculateTaxBreakdown,
  formatAggregateTaxName,
  formatInclusiveTaxBadge,
  getEffectiveTaxRate,
  hasStackedTaxRules,
  mergeBusinessTaxSettings,
  readBusinessTaxSettings,
  readServiceTaxRatePercent,
  resolveCheckoutTaxRules,
  sumTaxRuleRates,
  toPublicBusinessTaxSettings,
  type BusinessTaxSettings,
  type TaxPricingModel,
  type TaxRule,
} from '../../common/utils/business-tax.util.js';
import { readBookingListAmounts } from '../booking/booking-payment-summary.util.js';
import { matchServicesByQuery } from './ai-orchestration.helpers.js';
import {
  parseBusinessTaxFromPrompt,
  parseSetServiceTaxRateFromPrompt,
} from './ai-business-tax.util.js';
import {
  parseConfigureStackedTaxRulesFromPrompt,
  ruleMatchesRemoveQuery,
  toTaxRuleId,
} from './ai-stacked-tax.util.js';
import {
  parseExplainStripeTaxChargeFromPrompt,
  type ParsedExplainStripeTaxCharge,
} from './ai-stripe-tax-charge.util.js';
import { parseLookupBookingTaxMetadataFromPrompt } from './ai-lookup-booking-tax-metadata.util.js';
import { parseExplainAppointmentTaxFromPrompt } from './ai-appointment-tax.util.js';
import { parseQuoteStaffBookingTaxFromPrompt } from './ai-quote-staff-booking-tax.util.js';
import { parseSummarizeCustomerTaxPaidFromPrompt } from './ai-summarize-customer-tax-paid.util.js';
import {
  parseExplainCheckoutTaxFromPrompt,
  type CheckoutTaxAspect,
} from './ai-checkout-tax.util.js';
import {
  parseExplainConsumerCheckoutTaxFromPrompt,
  type ConsumerCheckoutTaxAspect,
} from './ai-consumer-checkout-tax.util.js';
import {
  readBookingPricingTaxMetadata,
  resolveBookingForTaxQuery,
  type ParsedBookingTaxQuery,
} from './ai-booking-tax-query.util.js';
import {
  BookingStatus,
  PaymentStatus,
} from '../booking/entities/booking.entity.js';

export interface BusinessTaxLogicDeps {
  businessRepo: Pick<Repository<Business>, 'findOne' | 'save'>;
  serviceRepo: Pick<Repository<Service>, 'find' | 'save'>;
  bookingRepo: Pick<Repository<Booking>, 'findOne' | 'find'>;
}

function failure(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: false, action, summary, details: details ?? {} };
}

function success(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: true, action, summary, details: details ?? {} };
}

function modelLabel(model: TaxPricingModel): string {
  return model === 'inclusive' ? 'tax-inclusive' : 'tax-exclusive';
}

export async function handleConfigureBusinessTaxLogic(
  deps: BusinessTaxLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('configure_business_tax', 'Business not found.');
  }

  const parsed = parseBusinessTaxFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'configure_business_tax',
      'Specify tax settings to change (e.g. "Enable 20% VAT", "Switch to tax-inclusive pricing", or "Set our GST rate to 5%").',
      { clarify: true, missing: ['enabled', 'rate', 'model', 'name'] },
    );
  }

  const settings = business.settings as Record<string, unknown> | undefined;
  const current = readBusinessTaxSettings(settings);

  const next: BusinessTaxSettings = {
    enabled: parsed.enabled ?? current.enabled,
    name: parsed.name ?? current.name,
    rate: parsed.rate ?? current.rate,
    model: parsed.model ?? current.model,
    taxNumber: current.taxNumber,
    ...(current.rules ? { rules: current.rules } : {}),
  };

  if (parsed.enabled === true && next.rate <= 0 && parsed.rate === undefined) {
    return failure(
      'configure_business_tax',
      'Specify a tax rate when enabling tax (e.g. "Enable 20% VAT").',
      { clarify: true, missing: ['rate'] },
    );
  }

  let normalized: BusinessTaxSettings;
  try {
    normalized = assertBusinessTaxSettings(next);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Invalid tax settings';
    return failure('configure_business_tax', message, { clarify: true });
  }

  const unchanged =
    normalized.enabled === current.enabled &&
    normalized.rate === current.rate &&
    normalized.name === current.name &&
    normalized.model === current.model;

  if (unchanged) {
    return success(
      'configure_business_tax',
      `Business tax settings are already ${normalized.enabled ? 'enabled' : 'disabled'} (${normalized.name} ${normalized.rate}% ${modelLabel(normalized.model)}).`,
      {
        tax: normalized,
        unchanged: true,
      },
    );
  }

  business.settings = mergeBusinessSettings(
    settings,
    mergeBusinessTaxSettings(settings ?? {}, normalized),
  );
  await deps.businessRepo.save(business);

  const summary = normalized.enabled
    ? `Business tax updated: ${normalized.name} ${normalized.rate}% (${modelLabel(normalized.model)} pricing). Checkout and reports will use these settings.`
    : `Business tax disabled (was ${current.name} ${current.rate}% ${modelLabel(current.model)}).`;

  return success('configure_business_tax', summary, {
    tax: normalized,
    previousTax: current,
  });
}

function formatTaxBreakdownExample(
  samplePrice: number,
  tax: BusinessTaxSettings,
): string {
  const rate = tax.enabled ? tax.rate : 0;
  const breakdown = calculateTaxBreakdown(
    samplePrice,
    rate,
    tax.model,
    tax.name,
  );
  const priceLabel = `$${samplePrice}`;
  if (!tax.enabled || rate <= 0) {
    return `Example on ${priceLabel}: no tax applied (net ${breakdown.netAmount}, gross ${breakdown.grossAmount}).`;
  }
  if (tax.model === 'inclusive') {
    return `Example on ${priceLabel} tax-inclusive price: net ${breakdown.netAmount}, ${tax.name} ${breakdown.taxAmount} (${breakdown.taxRate}%), gross ${breakdown.grossAmount}.`;
  }
  return `Example on ${priceLabel} tax-exclusive price: net ${breakdown.netAmount}, ${tax.name} ${breakdown.taxAmount} (${breakdown.taxRate}%), customer pays ${breakdown.grossAmount}.`;
}

function parseSamplePriceFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): number {
  const fromParams = normalizeSamplePrice(params.samplePrice);
  if (fromParams != null) return fromParams;

  const match = prompt.match(/\$\s*(\d+(?:\.\d+)?)/);
  if (match?.[1]) {
    const parsed = Number(match[1]);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  return 100;
}

function normalizeSamplePrice(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.replace(/[$,]/g, ''));
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
}

export async function handleExplainBusinessTaxLogic(
  deps: BusinessTaxLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('explain_business_tax', 'Business not found.');
  }

  const settings = business.settings as Record<string, unknown> | undefined;
  const tax = readBusinessTaxSettings(settings);
  const samplePrice = parseSamplePriceFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    params,
  );
  const example = formatTaxBreakdownExample(samplePrice, tax);
  const taxNumberPart = tax.taxNumber
    ? `Tax number on file: ${tax.taxNumber}.`
    : 'No tax number on file.';

  const summary = tax.enabled
    ? [
        `Business tax is enabled: ${tax.name} ${tax.rate}% (${modelLabel(tax.model)} pricing).`,
        taxNumberPart,
        example,
        'Checkout and reports use these salon-wide settings; individual services may override via metadata.taxRatePercent.',
      ].join(' ')
    : [
        'Business tax is disabled for this salon.',
        taxNumberPart,
        example,
        'Enable tax in settings or say e.g. "Enable 20% VAT" to start collecting.',
      ].join(' ');

  return success('explain_business_tax', summary, {
    tax,
    taxEnabled: tax.enabled,
    taxActive: businessTaxIsActive(tax),
    samplePrice,
    exampleBreakdown: calculateTaxBreakdown(
      samplePrice,
      tax.enabled ? tax.rate : 0,
      tax.model,
      tax.name,
    ),
  });
}

function buildSetServiceTaxConfirmationResult(
  prompt: string,
  serviceQuery: string,
  taxRatePercent: number,
  matched: Pick<Service, 'id' | 'name'>[],
): CommandResult {
  const rateLabel =
    taxRatePercent <= 0 ? 'tax-exempt (0%)' : `${taxRatePercent}% tax`;
  const previewNames = matched
    .slice(0, 5)
    .map((service) => service.name)
    .join(', ');
  const moreCount = matched.length > 5 ? matched.length - 5 : 0;

  return success(
    'set_service_tax_rate',
    [
      `Ready to set ${rateLabel} on ${matched.length} service(s) matching "${serviceQuery}".`,
      previewNames
        ? `Matches: ${previewNames}${moreCount > 0 ? ` and ${moreCount} more` : ''}.`
        : '',
      'Confirm below to update service tax overrides.',
    ]
      .filter(Boolean)
      .join(' '),
    {
      requiresExecutionConfirmation: true,
      confirmationPrompt: prompt,
      interpretedAction: 'set_service_tax_rate',
      previewParams: {
        serviceQuery,
        taxRatePercent,
        serviceCount: matched.length,
        serviceIds: matched.map((service) => service.id),
        serviceNames: matched.map((service) => service.name),
      },
      serviceQuery,
      taxRatePercent,
      serviceCount: matched.length,
    },
  );
}

export async function handleSetServiceTaxRateLogic(
  deps: BusinessTaxLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
  confirmed = false,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('set_service_tax_rate', 'Business not found.');
  }

  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const parsed = parseSetServiceTaxRateFromPrompt(effectivePrompt, params);
  if (!parsed) {
    return failure(
      'set_service_tax_rate',
      'Specify which services and tax rate to apply (e.g. "Make massage services tax-exempt" or "Apply 10% tax to medical consultations only").',
      { clarify: true, missing: ['serviceQuery', 'taxRatePercent'] },
    );
  }

  const services = await deps.serviceRepo.find({
    where: { businessId },
    select: { id: true, name: true, metadata: true },
  });

  const matched = parsed.serviceIds?.length
    ? services.filter((service) => parsed.serviceIds!.includes(service.id))
    : matchServicesByQuery(services, parsed.serviceQuery);

  if (!matched.length) {
    return failure(
      'set_service_tax_rate',
      `No catalog services matched "${parsed.serviceQuery}". Try a broader name like "massage" or "consultation".`,
      { clarify: true, serviceQuery: parsed.serviceQuery },
    );
  }

  const needsUpdate = matched.filter((service) => {
    const current = readServiceTaxRatePercent(
      (service.metadata ?? {}) as Record<string, unknown>,
    );
    return current !== parsed.taxRatePercent;
  });

  if (!needsUpdate.length) {
    const rateLabel =
      parsed.taxRatePercent <= 0
        ? 'tax-exempt'
        : `${parsed.taxRatePercent}% tax`;
    return success(
      'set_service_tax_rate',
      `All ${matched.length} matching service(s) already use ${rateLabel}.`,
      {
        serviceQuery: parsed.serviceQuery,
        taxRatePercent: parsed.taxRatePercent,
        serviceCount: 0,
        unchanged: true,
        serviceIds: matched.map((service) => service.id),
      },
    );
  }

  if (!confirmed) {
    return buildSetServiceTaxConfirmationResult(
      effectivePrompt,
      parsed.serviceQuery,
      parsed.taxRatePercent,
      needsUpdate,
    );
  }

  const updatedServiceIds: string[] = [];
  for (const service of needsUpdate) {
    const metadata = applyServiceTaxRateToMetadata(
      (service.metadata ?? {}) as Record<string, unknown>,
      parsed.taxRatePercent,
    );
    await deps.serviceRepo.save({
      id: service.id,
      metadata,
    } as Service);
    updatedServiceIds.push(service.id);
  }

  const rateLabel =
    parsed.taxRatePercent <= 0
      ? 'tax-exempt (0%)'
      : `${parsed.taxRatePercent}% tax`;
  return success(
    'set_service_tax_rate',
    `Updated ${updatedServiceIds.length} service(s) matching "${parsed.serviceQuery}" to ${rateLabel}.`,
    {
      serviceQuery: parsed.serviceQuery,
      taxRatePercent: parsed.taxRatePercent,
      serviceCount: updatedServiceIds.length,
      updatedServiceIds,
      serviceNames: needsUpdate.map((service) => service.name),
    },
  );
}

function formatPublicCheckoutTaxAspectSummary(
  aspect: CheckoutTaxAspect,
  publicTax: ReturnType<typeof toPublicBusinessTaxSettings>,
  inclusiveBadge: string | null,
  example: string,
): string {
  if (!publicTax) return '';

  const stackedNote =
    publicTax.rules && publicTax.rules.length > 1
      ? ` Stacked rules (${publicTax.rules.map((rule) => `${rule.name} ${rule.rate}%`).join(' + ')}) appear as separate lines when multiple rates apply.`
      : '';

  switch (aspect) {
    case 'service_list':
      return publicTax.model === 'inclusive'
        ? [
            `On the booking page service catalog, tax-inclusive pricing shows an "${inclusiveBadge ?? 'incl.'}" badge on each service card when tax is embedded in the listed price.`,
            `The badge reflects ${publicTax.name} at ${publicTax.rate}% — listed prices already include tax.`,
          ].join(' ')
        : [
            'On the booking page service catalog, tax-exclusive pricing shows the net service price without an incl. badge.',
            `Tax is added later on the checkout payment summary (${publicTax.name} ${publicTax.rate}%).`,
          ].join(' ');
    case 'checkout':
      return publicTax.model === 'inclusive'
        ? [
            'During checkout on this booking page, the payment summary shows the service total with tax already included.',
            inclusiveBadge
              ? `Service cards used an "${inclusiveBadge}" badge; checkout should not add tax again.${stackedNote}`
              : `Checkout should not add tax again on top of the listed price.${stackedNote}`,
          ].join(' ')
        : [
            `During checkout on this booking page, the payment summary adds a ${publicTax.name} ${publicTax.rate}% tax line before you pay.`,
            example,
            stackedNote.trim(),
          ]
            .filter(Boolean)
            .join(' ');
    case 'confirmation':
      return [
        'On the booking confirmation step before payment, the summary repeats the tax breakdown from checkout.',
        publicTax.model === 'inclusive'
          ? `Tax-inclusive total already includes ${publicTax.name} (${publicTax.rate}%).`
          : `Tax-exclusive checkout shows net service amount plus ${publicTax.name} tax.${stackedNote}`,
        'This matches the tax lines shown on the checkout payment summary.',
      ].join(' ');
    default:
      return [
        `On this booking page, ${publicTax.name} at ${publicTax.rate}% uses ${modelLabel(publicTax.model)} pricing.`,
        publicTax.model === 'inclusive'
          ? inclusiveBadge
            ? `Service cards may show "${inclusiveBadge}"; checkout and confirmation summaries show the gross total without adding tax again.`
            : 'Service cards may show an incl. badge; checkout totals match listed prices.'
          : `Service cards show net prices; checkout and confirmation add a tax line before payment. ${example}`,
        stackedNote.trim(),
      ]
        .filter(Boolean)
        .join(' ');
  }
}

export async function handleExplainCheckoutTaxLogic(
  deps: BusinessTaxLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const parsed = parseExplainCheckoutTaxFromPrompt(effectivePrompt);
  const aspect =
    (typeof params.aspect === 'string' &&
    ['checkout', 'confirmation', 'service_list', 'all'].includes(params.aspect)
      ? params.aspect
      : parsed?.aspect) ?? 'all';

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('explain_checkout_tax', 'Business not found.');
  }

  const settings = business.settings as Record<string, unknown> | undefined;
  const tax = readBusinessTaxSettings(settings);
  const publicTax = toPublicBusinessTaxSettings(tax);
  const samplePrice = 100;
  const example = formatTaxBreakdownExample(samplePrice, tax);
  const inclusiveBadge = publicTax ? formatInclusiveTaxBadge(publicTax) : null;

  if (!publicTax) {
    return success(
      'explain_checkout_tax',
      [
        'This salon does not currently charge tax on the booking page.',
        'Listed service prices are the amounts due — no separate tax line or "incl. VAT" badge is shown.',
      ].join(' '),
      {
        taxEnabled: false,
        publicTax: null,
        aspect,
        samplePrice,
      },
    );
  }

  const aspectSummary = formatPublicCheckoutTaxAspectSummary(
    aspect as CheckoutTaxAspect,
    publicTax,
    inclusiveBadge,
    example,
  );

  const summary = [
    `This booking page uses ${publicTax.name} at ${publicTax.rate}% (${publicTax.model} pricing).`,
    aspectSummary,
  ].join(' ');

  return success('explain_checkout_tax', summary, {
    taxEnabled: true,
    publicTax,
    inclusiveBadge,
    aspect,
    samplePrice,
    exampleBreakdown: calculateTaxBreakdown(
      samplePrice,
      publicTax.rate,
      publicTax.model,
      publicTax.name,
    ),
  });
}

function formatConsumerCheckoutTaxAspectSummary(
  aspect: import('./ai-consumer-checkout-tax.util.js').ConsumerCheckoutTaxAspect,
  publicTax: ReturnType<typeof toPublicBusinessTaxSettings>,
  inclusiveBadge: string | null,
  example: string,
): string {
  if (!publicTax) return '';

  const stackedNote =
    publicTax.rules && publicTax.rules.length > 1
      ? ` Stacked rules (${publicTax.rules.map((rule) => `${rule.name} ${rule.rate}%`).join(' + ')}) appear as separate lines when multiple rates apply.`
      : '';

  switch (aspect) {
    case 'service_list':
      return publicTax.model === 'inclusive'
        ? [
            `On the consumer app service list, tax-inclusive pricing shows an "${inclusiveBadge ?? 'incl.'}" badge on each service card when tax is embedded in the listed price.`,
            `The badge reflects ${publicTax.name} at ${publicTax.rate}% — listed prices already include tax.`,
          ].join(' ')
        : [
            'On the consumer app service list, tax-exclusive pricing shows the net service price without an incl. badge.',
            `Tax is added later on the checkout payment summary (${publicTax.name} ${publicTax.rate}%).`,
          ].join(' ');
    case 'checkout':
      return publicTax.model === 'inclusive'
        ? [
            'During checkout in the consumer app, the payment summary shows the service total with tax already included.',
            inclusiveBadge
              ? `Service cards used an "${inclusiveBadge}" badge; checkout should not add tax again.${stackedNote}`
              : `Checkout should not add tax again on top of the listed price.${stackedNote}`,
          ].join(' ')
        : [
            `During checkout in the consumer app, the payment summary adds a ${publicTax.name} ${publicTax.rate}% tax line before you pay.`,
            example,
            stackedNote.trim(),
          ]
            .filter(Boolean)
            .join(' ');
    case 'confirmation':
      return [
        'On the booking confirmation screen in the consumer app, the payment summary repeats the tax breakdown from checkout.',
        publicTax.model === 'inclusive'
          ? `Tax-inclusive total already includes ${publicTax.name} (${publicTax.rate}%).`
          : `Tax-exclusive checkout shows net service amount plus ${publicTax.name} tax.${stackedNote}`,
        'This matches the tax lines shown before payment.',
      ].join(' ');
    default:
      return [
        `In the consumer app, ${publicTax.name} at ${publicTax.rate}% uses ${modelLabel(publicTax.model)} pricing.`,
        publicTax.model === 'inclusive'
          ? inclusiveBadge
            ? `Service list cards may show "${inclusiveBadge}"; checkout and confirmation payment summaries show the gross total without adding tax again.`
            : 'Service list cards may show an incl. badge; checkout totals match listed prices.'
          : `Service list shows net prices; checkout and confirmation add a tax line before payment. ${example}`,
        stackedNote.trim(),
      ]
        .filter(Boolean)
        .join(' ');
  }
}

export async function handleExplainConsumerCheckoutTaxLogic(
  deps: BusinessTaxLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const parsed = parseExplainConsumerCheckoutTaxFromPrompt(effectivePrompt);
  const aspect =
    (typeof params.aspect === 'string' &&
    ['checkout', 'confirmation', 'service_list', 'all'].includes(params.aspect)
      ? params.aspect
      : parsed?.aspect) ?? 'all';

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('explain_consumer_checkout_tax', 'Business not found.');
  }

  const settings = business.settings as Record<string, unknown> | undefined;
  const tax = readBusinessTaxSettings(settings);
  const publicTax = toPublicBusinessTaxSettings(tax);
  const samplePrice = 100;
  const example = formatTaxBreakdownExample(samplePrice, tax);
  const inclusiveBadge = publicTax ? formatInclusiveTaxBadge(publicTax) : null;

  if (!publicTax) {
    return success(
      'explain_consumer_checkout_tax',
      [
        'This salon does not charge tax in the consumer app.',
        'Service list prices match checkout and confirmation totals — no incl. badge or separate tax lines appear.',
      ].join(' '),
      {
        taxEnabled: false,
        publicTax: null,
        aspect,
        samplePrice,
      },
    );
  }

  const aspectSummary = formatConsumerCheckoutTaxAspectSummary(
    aspect as ConsumerCheckoutTaxAspect,
    publicTax,
    inclusiveBadge,
    example,
  );

  const summary = [
    `Consumer app tax display uses ${publicTax.name} at ${publicTax.rate}% (${publicTax.model} pricing).`,
    aspectSummary,
  ].join(' ');

  return success('explain_consumer_checkout_tax', summary, {
    taxEnabled: true,
    publicTax,
    inclusiveBadge,
    aspect,
    samplePrice,
    exampleBreakdown: calculateTaxBreakdown(
      samplePrice,
      publicTax.rate,
      publicTax.model,
      publicTax.name,
    ),
  });
}

function mergeStackedTaxRules(
  currentRules: TaxRule[],
  incomingRules: Array<{ name: string; rate: number }>,
): TaxRule[] {
  const next = [...currentRules];
  for (const incoming of incomingRules) {
    const index = next.findIndex(
      (rule) => rule.name.toLowerCase() === incoming.name.toLowerCase(),
    );
    if (index >= 0) {
      next[index] = {
        ...next[index],
        name: incoming.name,
        rate: incoming.rate,
      };
    } else {
      next.push({
        id: toTaxRuleId(incoming.name, next.length),
        name: incoming.name,
        rate: incoming.rate,
      });
    }
  }
  return next;
}

function formatStackedTaxBreakdownExample(
  samplePrice: number,
  tax: BusinessTaxSettings,
): string {
  const rules = tax.rules ?? [];
  if (!rules.length) {
    return `Example on $${samplePrice}: no stacked rules configured.`;
  }

  const breakdown = calculateStackedTaxBreakdown(
    samplePrice,
    rules,
    tax.model,
    formatAggregateTaxName(rules, tax.name),
  );
  const ruleLines =
    breakdown.rules
      ?.map((rule) => `${rule.name} ${rule.rate}% = $${rule.amount}`)
      .join('; ') ?? '';

  if (tax.model === 'inclusive') {
    return [
      `Example on $${samplePrice} tax-inclusive price:`,
      `net $${breakdown.netAmount},`,
      `embedded tax $${breakdown.taxAmount} (${breakdown.taxRate}% combined: ${ruleLines}),`,
      `gross $${breakdown.grossAmount}.`,
    ].join(' ');
  }

  return [
    `Example on $${samplePrice} tax-exclusive price:`,
    `net $${breakdown.netAmount},`,
    `stacked tax $${breakdown.taxAmount} (${breakdown.taxRate}% combined: ${ruleLines}),`,
    `customer pays $${breakdown.grossAmount}.`,
  ].join(' ');
}

export async function handleConfigureStackedTaxRulesLogic(
  deps: BusinessTaxLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('configure_stacked_tax_rules', 'Business not found.');
  }

  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const parsed = parseConfigureStackedTaxRulesFromPrompt(
    effectivePrompt,
    params,
  );
  if (!parsed) {
    return failure(
      'configure_stacked_tax_rules',
      'Specify stacked tax rules to add or remove (e.g. "Add 5% GST and 8% PST", "Stack 2% federal and 5% state sales tax", or "Remove the state tax rule").',
      { clarify: true, missing: ['rules', 'removeRuleName'] },
    );
  }

  const settings = business.settings as Record<string, unknown> | undefined;
  const current = readBusinessTaxSettings(settings);
  let nextRules = [...(current.rules ?? [])];

  if (parsed.operation === 'remove') {
    const query = parsed.removeRuleName ?? '';
    const filtered = nextRules.filter(
      (rule) => !ruleMatchesRemoveQuery(rule, query),
    );
    if (filtered.length === nextRules.length) {
      return failure(
        'configure_stacked_tax_rules',
        `No stacked tax rule matched "${query}". Current rules: ${
          nextRules.length
            ? nextRules.map((rule) => `${rule.name} ${rule.rate}%`).join(', ')
            : 'none'
        }.`,
        { clarify: true, removeRuleName: query },
      );
    }
    nextRules = filtered;
  } else if (parsed.operation === 'add') {
    if (!parsed.rules?.length) {
      return failure(
        'configure_stacked_tax_rules',
        'Specify each stacked tax rule with a rate percent (e.g. "Add 5% GST and 8% PST" or "Stack 2% federal and 5% state sales tax").',
        { clarify: true, missing: ['rules'] },
      );
    }
    nextRules = mergeStackedTaxRules(nextRules, parsed.rules);
  } else {
    return failure(
      'configure_stacked_tax_rules',
      'Specify stacked tax rules to add or a rule name to remove.',
      { clarify: true, missing: ['rules', 'removeRuleName'] },
    );
  }

  if (nextRules.length === 0) {
    const next: BusinessTaxSettings = {
      enabled: false,
      name: current.name,
      rate: 0,
      model: current.model,
      taxNumber: current.taxNumber,
    };
    business.settings = mergeBusinessSettings(
      settings,
      mergeBusinessTaxSettings(settings ?? {}, next),
    );
    await deps.businessRepo.save(business);
    return success(
      'configure_stacked_tax_rules',
      'Removed all stacked tax rules and disabled business tax.',
      {
        tax: next,
        previousTax: current,
        removedAllRules: true,
      },
    );
  }

  const effectiveRate = sumTaxRuleRates(nextRules);
  const next: BusinessTaxSettings = {
    enabled: true,
    name: formatAggregateTaxName(nextRules, current.name),
    rate: effectiveRate,
    model: current.model,
    taxNumber: current.taxNumber,
    rules: nextRules,
  };

  let normalized: BusinessTaxSettings;
  try {
    normalized = assertBusinessTaxSettings(next);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Invalid stacked tax settings';
    return failure('configure_stacked_tax_rules', message, { clarify: true });
  }

  const unchanged =
    current.enabled === normalized.enabled &&
    current.rate === normalized.rate &&
    JSON.stringify(current.rules ?? []) ===
      JSON.stringify(normalized.rules ?? []);

  if (unchanged) {
    const ruleList = normalized.rules
      ?.map((rule) => `${rule.name} ${rule.rate}%`)
      .join(', ');
    return success(
      'configure_stacked_tax_rules',
      `Stacked tax rules are already ${ruleList} (${normalized.rate}% combined, ${modelLabel(normalized.model)} pricing).`,
      {
        tax: normalized,
        unchanged: true,
      },
    );
  }

  business.settings = mergeBusinessSettings(
    settings,
    mergeBusinessTaxSettings(settings ?? {}, normalized),
  );
  await deps.businessRepo.save(business);

  const ruleList = normalized.rules
    ?.map((rule) => `${rule.name} ${rule.rate}%`)
    .join(', ');
  const summary =
    parsed.operation === 'remove'
      ? `Removed stacked tax rule "${parsed.removeRuleName}". Remaining rules: ${ruleList} (${normalized.rate}% combined).`
      : `Stacked tax rules updated: ${ruleList} (${normalized.rate}% combined, ${modelLabel(normalized.model)} pricing).`;

  return success('configure_stacked_tax_rules', summary, {
    tax: normalized,
    previousTax: current,
    operation: parsed.operation,
    ...(parsed.removeRuleName ? { removeRuleName: parsed.removeRuleName } : {}),
    ...(parsed.rules ? { addedRules: parsed.rules } : {}),
  });
}

export async function handleExplainStackedTaxLogic(
  deps: BusinessTaxLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('explain_stacked_tax', 'Business not found.');
  }

  const settings = business.settings as Record<string, unknown> | undefined;
  const tax = readBusinessTaxSettings(settings);
  const rules = tax.rules ?? [];
  const samplePrice = parseSamplePriceFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    params,
  );

  if (!hasStackedTaxRules(tax)) {
    const effectiveRate = getEffectiveTaxRate(tax);
    return success(
      'explain_stacked_tax',
      [
        'No stacked tax rules are configured for this salon.',
        tax.enabled && effectiveRate > 0
          ? `Business tax uses a single ${tax.name} rate of ${effectiveRate}% (${modelLabel(tax.model)} pricing).`
          : 'Business tax is disabled.',
        'Say e.g. "Add 5% GST and 8% PST" to configure parallel stacked rules.',
      ].join(' '),
      {
        tax,
        hasStackedRules: false,
        samplePrice,
      },
    );
  }

  const effectiveRate = sumTaxRuleRates(rules);
  const ruleList = rules.map((rule) => `${rule.name} ${rule.rate}%`).join(', ');
  const example = formatStackedTaxBreakdownExample(samplePrice, tax);
  const breakdown = calculateStackedTaxBreakdown(
    samplePrice,
    rules,
    tax.model,
    formatAggregateTaxName(rules, tax.name),
  );

  const summary = [
    `Stacked tax has ${rules.length} rule(s): ${ruleList}.`,
    `Combined effective rate: ${effectiveRate}% (${modelLabel(tax.model)} pricing).`,
    tax.enabled
      ? 'Tax is enabled for checkout and reports.'
      : 'Tax is currently disabled in settings.',
    example,
  ].join(' ');

  return success('explain_stacked_tax', summary, {
    tax,
    hasStackedRules: true,
    rules,
    effectiveRate,
    samplePrice,
    exampleBreakdown: breakdown,
  });
}

function formatStripeTaxChargeSummary(
  booking: Booking,
  summary: BookingPaymentSummary,
): string {
  const customerLabel = booking.customer?.name ?? 'the customer';
  const serviceLabel = booking.service?.name ?? 'the service';
  const currency = summary.currency;
  const amountDue = summary.cashPaid;
  const taxAmount = summary.taxAmount ?? 0;
  const netAmount = summary.netAmount;
  const taxModel = summary.taxModel ?? 'exclusive';
  const taxName = summary.taxName ?? 'Tax';
  const taxRate = summary.taxRate ?? 0;

  const taxLineSummary =
    summary.taxLines && summary.taxLines.length > 1
      ? summary.taxLines
          .map(
            (line) => `${line.name} ${line.rate}% = ${currency} ${line.amount}`,
          )
          .join('; ')
      : `${taxName} ${taxRate}% = ${currency} ${taxAmount}`;

  const pricingFields = [
    `metadata.pricing.amountDue=${amountDue}`,
    `taxAmount=${taxAmount}`,
    taxModel === 'inclusive' && netAmount != null
      ? `netAmount=${netAmount}`
      : null,
    `taxModel=${taxModel}`,
    summary.taxLines && summary.taxLines.length > 1
      ? 'taxRules[] present'
      : null,
  ]
    .filter(Boolean)
    .join(', ');

  if (!summary.taxEnabled || taxAmount <= 0) {
    return [
      `Stripe charged ${currency} ${amountDue} for ${customerLabel}'s ${serviceLabel} booking (${booking.id}).`,
      'No tax was frozen on metadata.pricing for this booking — amountDue is the full service total.',
      `Pricing snapshot: ${pricingFields}.`,
    ].join(' ');
  }

  const modelExplanation =
    taxModel === 'inclusive'
      ? [
          `Tax-inclusive pricing: Stripe charged the gross ${currency} ${amountDue} shown at checkout.`,
          `Embedded tax is ${currency} ${taxAmount} (${taxLineSummary}); net service amount was ${currency} ${netAmount ?? 'n/a'}.`,
          'The customer paid the listed total — tax was not added again at payment.',
        ].join(' ')
      : [
          `Tax-exclusive pricing: Stripe charged ${currency} ${amountDue} = net ${currency} ${netAmount ?? amountDue - taxAmount} + tax ${currency} ${taxAmount}.`,
          `Tax lines: ${taxLineSummary}.`,
          'amountDue in metadata.pricing is the inclusive total sent to Stripe.',
        ].join(' ');

  return [
    `Stripe charged ${currency} ${amountDue} for ${customerLabel}'s ${serviceLabel} booking (${booking.id}).`,
    modelExplanation,
    `Frozen pricing fields: ${pricingFields}.`,
  ].join(' ');
}

export async function handleExplainStripeTaxChargeLogic(
  deps: BusinessTaxLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const parsed = parseExplainStripeTaxChargeFromPrompt(effectivePrompt, params);
  if (!parsed) {
    return failure(
      'explain_stripe_tax_charge',
      'Ask why Stripe charged a specific amount and mention the booking or customer (e.g. "Why did Stripe charge $120 for Jane\'s booking?").',
      { clarify: true, missing: ['bookingId', 'customerName'] },
    );
  }

  const booking = await resolveBookingForTaxQuery(deps, businessId, parsed);
  if (!booking) {
    return failure(
      'explain_stripe_tax_charge',
      parsed.bookingId
        ? `No booking matched "${parsed.bookingId}".`
        : parsed.customerName
          ? `No booking found for customer "${parsed.customerName}" with frozen tax pricing.`
          : 'No recent booking with metadata.pricing tax fields found. Mention a booking id or customer name.',
      { clarify: true, ...parsed },
    );
  }

  const paymentSummary = resolveBookingPaymentSummary({
    metadata: (booking.metadata ?? {}) as Record<string, unknown>,
    service: booking.service,
  });
  if (!paymentSummary) {
    return failure(
      'explain_stripe_tax_charge',
      `Booking ${booking.id} has no metadata.pricing payment snapshot to explain.`,
      { clarify: true, bookingId: booking.id },
    );
  }
  const summary = formatStripeTaxChargeSummary(booking, paymentSummary);
  const pricing = ((booking.metadata ?? {}) as Record<string, unknown>)
    .pricing as Record<string, unknown> | undefined;

  return success('explain_stripe_tax_charge', summary, {
    bookingId: booking.id,
    customerName: booking.customer?.name ?? null,
    serviceName: booking.service?.name ?? null,
    pricing: pricing ?? null,
    paymentSummary,
    taxModel: paymentSummary.taxModel ?? null,
    taxAmount: paymentSummary.taxAmount ?? 0,
    amountDue: paymentSummary.cashPaid,
  });
}

function formatLookupBookingTaxMetadataSummary(
  booking: Booking,
  taxMetadata: Record<string, unknown>,
): string {
  const customerLabel = booking.customer?.name ?? 'unknown customer';
  const lines = [
    `Booking ${booking.id} (${customerLabel}) — frozen metadata.pricing tax snapshot:`,
    `taxEnabled=${taxMetadata.taxEnabled}`,
    `taxName=${taxMetadata.taxName ?? 'n/a'}`,
    `taxRate=${taxMetadata.taxRate ?? 'n/a'}`,
    `taxModel=${taxMetadata.taxModel ?? 'n/a'}`,
    `taxAmount=${taxMetadata.taxAmount ?? 'n/a'}`,
    `netAmount=${taxMetadata.netAmount ?? 'n/a'}`,
    `amountDue=${taxMetadata.amountDue ?? 'n/a'}`,
    `amountPaid=${taxMetadata.amountPaid ?? 'n/a'}`,
  ];
  if (Array.isArray(taxMetadata.taxRules) && taxMetadata.taxRules.length > 0) {
    lines.push(`taxRules=${JSON.stringify(taxMetadata.taxRules)}`);
  }
  if (taxMetadata.stripeSessionId) {
    lines.push(`stripeSessionId=${taxMetadata.stripeSessionId}`);
  }
  lines.push(
    'Use these fields for receipts, disputes, and Stripe reconciliation.',
  );
  return lines.join(' ');
}

export async function handleLookupBookingTaxMetadataLogic(
  deps: BusinessTaxLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const parsed = parseLookupBookingTaxMetadataFromPrompt(
    effectivePrompt,
    params,
  );
  if (!parsed) {
    return failure(
      'lookup_booking_tax_metadata',
      'Specify a booking to look up (e.g. "Lookup tax metadata for booking bk-tax-001" or "Show metadata.pricing tax breakdown for Jane\'s Stripe checkout").',
      { clarify: true, missing: ['bookingId', 'customerName'] },
    );
  }

  const booking = await resolveBookingForTaxQuery(deps, businessId, parsed, {
    preferTaxPricing: false,
  });
  if (!booking) {
    return failure(
      'lookup_booking_tax_metadata',
      parsed.bookingId
        ? `No booking matched "${parsed.bookingId}".`
        : parsed.customerName
          ? `No booking found for customer "${parsed.customerName}".`
          : 'No booking found. Mention a booking id or customer name.',
      { clarify: true, ...parsed },
    );
  }

  const taxMetadata = readBookingPricingTaxMetadata(booking);
  if (!taxMetadata) {
    return failure(
      'lookup_booking_tax_metadata',
      `Booking ${booking.id} has no metadata.pricing snapshot stored.`,
      { clarify: true, bookingId: booking.id },
    );
  }

  const summary = formatLookupBookingTaxMetadataSummary(booking, taxMetadata);
  return success('lookup_booking_tax_metadata', summary, {
    bookingId: booking.id,
    customerName: booking.customer?.name ?? null,
    serviceName: booking.service?.name ?? null,
    taxMetadata,
    pricing:
      ((booking.metadata ?? {}) as Record<string, unknown>).pricing ?? null,
  });
}

function formatExplainAppointmentTaxSummary(
  booking: Booking,
  paymentSummary: BookingPaymentSummary,
): string {
  const customerLabel = booking.customer?.name ?? 'the customer';
  const serviceLabel = booking.service?.name ?? 'the service';
  const currency = paymentSummary.currency;
  const taxAmount = paymentSummary.taxAmount ?? 0;
  const collectedAmount =
    paymentSummary.grandTotal ?? paymentSummary.cashPaid ?? 0;
  const taxModel = paymentSummary.taxModel ?? 'exclusive';
  const paidLabel =
    booking.paymentStatus === PaymentStatus.PAID
      ? `marked paid — collected ${currency} ${collectedAmount}`
      : booking.paymentStatus === PaymentStatus.PARTIALLY_PAID
        ? `partially paid — recorded ${currency} ${collectedAmount}`
        : `payment status ${booking.paymentStatus} — breakdown shows ${currency} ${collectedAmount} due`;

  const taxLineText =
    paymentSummary.taxLines && paymentSummary.taxLines.length > 0
      ? paymentSummary.taxLines
          .map(
            (line) =>
              `${line.name} ${line.rate}%: ${currency} ${line.amount}${
                taxModel === 'inclusive' ? ' (included)' : ''
              }`,
          )
          .join('; ')
      : `${paymentSummary.taxName ?? 'Tax'} ${paymentSummary.taxRate ?? 0}%: ${currency} ${taxAmount}`;

  if (!paymentSummary.taxEnabled || taxAmount <= 0) {
    return [
      `Appointment for ${customerLabel} (${serviceLabel}, ${booking.id}) has no tax lines on the payment breakdown.`,
      `Collected amount: ${currency} ${collectedAmount} (${paidLabel}).`,
    ].join(' ');
  }

  const modelExplanation =
    taxModel === 'inclusive'
      ? `Tax-inclusive pricing: listed total ${currency} ${collectedAmount} already includes ${currency} ${taxAmount} tax (${taxLineText}). Net service amount was ${currency} ${paymentSummary.netAmount ?? 'n/a'}.`
      : `Tax-exclusive pricing: service net ${currency} ${paymentSummary.netAmount ?? collectedAmount - taxAmount} plus tax ${currency} ${taxAmount} (${taxLineText}) = ${currency} ${collectedAmount} collected.`;

  return [
    `Appointment payment breakdown for ${customerLabel} — ${serviceLabel} (${booking.id}).`,
    modelExplanation,
    `Payment: ${paidLabel}.`,
    'Tax values come from frozen metadata.pricing on the booking.',
  ].join(' ');
}

export async function handleExplainAppointmentTaxLogic(
  deps: BusinessTaxLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
  sessionEmployeeId?: string,
): Promise<CommandResult> {
  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const parsed = parseExplainAppointmentTaxFromPrompt(effectivePrompt, params);
  if (!parsed) {
    return failure(
      'explain_appointment_tax',
      'Ask about tax on an appointment payment breakdown (e.g. "Explain tax lines on this appointment" or "Is VAT included in the amount we collected?").',
      { clarify: true, missing: ['bookingId'] },
    );
  }

  const booking = await resolveBookingForTaxQuery(deps, businessId, parsed);
  if (!booking) {
    return failure(
      'explain_appointment_tax',
      parsed.bookingId
        ? `No appointment matched "${parsed.bookingId}".`
        : 'No recent appointment with tax pricing found. Mention a booking id.',
      { clarify: true, ...parsed },
    );
  }

  if (
    sessionEmployeeId &&
    booking.employeeId &&
    booking.employeeId !== sessionEmployeeId
  ) {
    return failure(
      'explain_appointment_tax',
      'That appointment is not on your provider schedule.',
      { clarify: true, bookingId: booking.id },
    );
  }

  const paymentSummary = resolveBookingPaymentSummary({
    metadata: (booking.metadata ?? {}) as Record<string, unknown>,
    service: booking.service,
  });
  if (!paymentSummary) {
    return failure(
      'explain_appointment_tax',
      `Appointment ${booking.id} has no payment breakdown data.`,
      { clarify: true, bookingId: booking.id },
    );
  }

  const summary = formatExplainAppointmentTaxSummary(booking, paymentSummary);
  return success('explain_appointment_tax', summary, {
    bookingId: booking.id,
    customerName: booking.customer?.name ?? null,
    serviceName: booking.service?.name ?? null,
    paymentStatus: booking.paymentStatus,
    paymentSummary,
    taxMetadata: readBookingPricingTaxMetadata(booking),
    collectedAmount: paymentSummary.grandTotal ?? paymentSummary.cashPaid ?? 0,
  });
}

type StaffBookingTaxSource =
  | 'service_override'
  | 'stacked_rules'
  | 'business_default'
  | 'tax_exempt'
  | 'tax_disabled';

function resolveStaffBookingTaxSource(
  tax: BusinessTaxSettings,
  serviceRatePercent: number | null,
): StaffBookingTaxSource {
  if (!tax.enabled) return 'tax_disabled';
  if (serviceRatePercent != null) {
    return serviceRatePercent <= 0 ? 'tax_exempt' : 'service_override';
  }
  if (hasStackedTaxRules(tax)) return 'stacked_rules';
  return 'business_default';
}

function formatStaffBookingTaxSourceExplanation(
  source: StaffBookingTaxSource,
  tax: BusinessTaxSettings,
  serviceRatePercent: number | null,
  rules: TaxRule[],
): string {
  switch (source) {
    case 'tax_disabled':
      return 'Business tax is disabled — no tax line would appear on this staff booking.';
    case 'tax_exempt':
      return `Service override metadata.taxRatePercent=0 makes this service tax-exempt (stacked rules and salon default do not apply).`;
    case 'service_override':
      return `Service override metadata.taxRatePercent=${serviceRatePercent}% replaces salon stacked rules and the default ${tax.name} rate for this booking preview.`;
    case 'stacked_rules': {
      const ruleList = rules
        .map((rule) => `${rule.name} ${rule.rate}%`)
        .join(' + ');
      return `Salon stacked tax rules apply (${ruleList}) — no per-service override on this catalog item.`;
    }
    default:
      return `Salon default ${tax.name} ${tax.rate}% applies — no stacked rules or per-service override on this catalog item.`;
  }
}

function resolveQuoteBasePrice(
  service: Pick<Service, 'price'>,
  parsed: { samplePrice?: number },
  prompt: string,
  params: Record<string, unknown>,
): number {
  if (parsed.samplePrice != null && parsed.samplePrice > 0) {
    return parsed.samplePrice;
  }
  const servicePrice = Number(service.price);
  if (Number.isFinite(servicePrice) && servicePrice > 0) {
    return servicePrice;
  }
  return parseSamplePriceFromPrompt(prompt, params);
}

export async function handleQuoteStaffBookingTaxLogic(
  deps: BusinessTaxLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const parsed = parseQuoteStaffBookingTaxFromPrompt(effectivePrompt, params);
  if (!parsed) {
    return failure(
      'quote_staff_booking_tax',
      'Specify a service to preview tax on (e.g. "Preview tax on massage before creating a booking" or "Quote GST on a $120 haircut").',
      { clarify: true, missing: ['serviceQuery'] },
    );
  }

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('quote_staff_booking_tax', 'Business not found.');
  }

  const services = await deps.serviceRepo.find({
    where: { businessId },
    select: { id: true, name: true, price: true, metadata: true },
  });
  const matched = matchServicesByQuery(services, parsed.serviceQuery);
  if (!matched.length) {
    return failure(
      'quote_staff_booking_tax',
      `No catalog services matched "${parsed.serviceQuery}". Try a broader name like "massage" or "consultation".`,
      { clarify: true, serviceQuery: parsed.serviceQuery },
    );
  }

  const service = matched[0];
  const settings = business.settings as Record<string, unknown> | undefined;
  const tax = readBusinessTaxSettings(settings);
  const serviceRate = readServiceTaxRatePercent(
    (service.metadata ?? {}) as Record<string, unknown>,
  );
  const source = resolveStaffBookingTaxSource(tax, serviceRate);
  const rules = resolveCheckoutTaxRules(tax, serviceRate);
  const basePrice = resolveQuoteBasePrice(
    service,
    parsed,
    effectivePrompt,
    params,
  );
  const overlay = applyTaxToCheckoutAmount(basePrice, tax, serviceRate);
  const sourceExplanation = formatStaffBookingTaxSourceExplanation(
    source,
    tax,
    serviceRate,
    rules,
  );

  if (!overlay) {
    return success(
      'quote_staff_booking_tax',
      [
        `Staff booking preview for ${service.name} at $${basePrice}: no tax would be charged.`,
        sourceExplanation,
      ].join(' '),
      {
        serviceId: service.id,
        serviceName: service.name,
        serviceQuery: parsed.serviceQuery,
        basePrice,
        taxSource: source,
        serviceTaxRatePercent: serviceRate,
        taxEnabled: false,
      },
    );
  }

  const ruleLines =
    overlay.taxRules && overlay.taxRules.length > 1
      ? overlay.taxRules
          .map((rule) => `${rule.name} ${rule.rate}% = $${rule.amount}`)
          .join('; ')
      : `${overlay.taxName} ${overlay.taxRate}% = $${overlay.taxAmount}`;

  const modelExplanation =
    overlay.taxModel === 'inclusive'
      ? `Tax-inclusive: listed $${overlay.paymentAmount} includes $${overlay.taxAmount} tax (${ruleLines}); net service amount $${overlay.netAmount}.`
      : `Tax-exclusive: service net $${overlay.netAmount} + tax $${overlay.taxAmount} (${ruleLines}) = customer pays $${overlay.paymentAmount}.`;

  const summary = [
    `Staff booking tax preview for ${service.name} at $${basePrice} (${modelLabel(overlay.taxModel)} pricing).`,
    modelExplanation,
    sourceExplanation,
  ].join(' ');

  return success('quote_staff_booking_tax', summary, {
    serviceId: service.id,
    serviceName: service.name,
    serviceQuery: parsed.serviceQuery,
    basePrice,
    taxSource: source,
    serviceTaxRatePercent: serviceRate,
    taxEnabled: true,
    quote: overlay,
    appliedRules: rules,
    matchCount: matched.length,
  });
}

export async function handleSummarizeCustomerTaxPaidLogic(
  deps: BusinessTaxLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const parsed = parseSummarizeCustomerTaxPaidFromPrompt(
    effectivePrompt,
    params,
  );
  if (!parsed) {
    return failure(
      'summarize_customer_tax_paid',
      'Mention a customer to summarize tax paid (e.g. "How much tax has Jane paid across her appointments?").',
      { clarify: true, missing: ['customerName'] },
    );
  }

  const bookings = await deps.bookingRepo.find({
    where: { businessId },
    relations: { customer: true, service: true },
    order: { startTime: 'DESC' },
    take: 500,
  });

  const needle = parsed.customerName.toLowerCase();
  const customerBookings = bookings.filter((booking) =>
    (booking.customer?.name ?? '').toLowerCase().includes(needle),
  );

  if (!customerBookings.length) {
    return failure(
      'summarize_customer_tax_paid',
      `No appointments found for customer "${parsed.customerName}".`,
      { clarify: true, customerName: parsed.customerName },
    );
  }

  const paidStatuses = new Set<PaymentStatus>([
    PaymentStatus.PAID,
    PaymentStatus.PARTIALLY_PAID,
  ]);
  let totalTaxPaid = 0;
  let appointmentsWithTax = 0;
  let paidAppointmentsChecked = 0;
  const customerLabel =
    customerBookings[0].customer?.name ?? parsed.customerName;

  for (const booking of customerBookings) {
    if (booking.status === BookingStatus.CANCELLED) continue;
    if (!paidStatuses.has(booking.paymentStatus)) continue;
    paidAppointmentsChecked += 1;

    const amounts = readBookingListAmounts(
      (booking.metadata ?? {}) as Record<string, unknown>,
    );
    if (amounts.taxAmount == null || amounts.taxAmount <= 0) continue;

    totalTaxPaid = roundTaxTotal(totalTaxPaid + amounts.taxAmount);
    appointmentsWithTax += 1;
  }

  if (paidAppointmentsChecked === 0) {
    return success(
      'summarize_customer_tax_paid',
      `${customerLabel} has no paid appointments with tax metadata in profile history.`,
      {
        customerName: customerLabel,
        totalTaxPaid: 0,
        appointmentsWithTax: 0,
        paidAppointmentsChecked: 0,
      },
    );
  }

  if (appointmentsWithTax === 0) {
    return success(
      'summarize_customer_tax_paid',
      `${customerLabel} has ${paidAppointmentsChecked} paid appointment(s), but none recorded tax in metadata.pricing.`,
      {
        customerName: customerLabel,
        totalTaxPaid: 0,
        appointmentsWithTax: 0,
        paidAppointmentsChecked,
      },
    );
  }

  const summary = [
    `${customerLabel} paid $${totalTaxPaid.toFixed(2)} tax across ${appointmentsWithTax} paid appointment(s) with tax metadata.`,
    `Totals come from booking metadata.pricing.taxAmount on the customer profile appointment history (${paidAppointmentsChecked} paid appointments reviewed).`,
  ].join(' ');

  return success('summarize_customer_tax_paid', summary, {
    customerName: customerLabel,
    totalTaxPaid,
    appointmentsWithTax,
    paidAppointmentsChecked,
    totalAppointments: customerBookings.length,
  });
}

function roundTaxTotal(value: number): number {
  return Math.round(value * 100) / 100;
}
