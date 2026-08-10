import { BookingStatus } from '../booking/entities/booking.entity.js';
import {
  rescueAssignCategoryToProviderIntent,
  rescueTransferServicesBetweenProvidersIntent,
  rescueUnassignServicesFromProviderIntent,
} from './ai-category-assignment.util.js';
import { isConfigureServiceOnlinePaymentPrompt } from './ai-service-online-payment.util.js';
import {
  enrichUpdateServicePricesParamsFromPrompt,
  rescueUpdateServicePricesOnlinePaymentFilterIntent,
} from './ai-update-service-prices-online-payment-filter.util.js';

export const OPERATIONS_BOOKING_INTENTS = [
  'no_show_recovery',
  'sick_day_replan',
] as const;
export const OPERATIONS_OPS_INTENTS = [
  'import_services_from_menu',
  'update_service_prices',
  'staff_service_matrix',
  'check_schedule_compliance',
  'revenue_forecast',
] as const;

export const OPERATIONS_STAFF_INTENTS = [
  'create_employee',
  'update_employee',
  'invite_staff_member',
  'deactivate_employee',
  'configure_online_booking',
  'update_team_member_role',
] as const;

export const OPERATIONS_INTENTS = [
  ...OPERATIONS_BOOKING_INTENTS,
  ...OPERATIONS_OPS_INTENTS,
  ...OPERATIONS_STAFF_INTENTS,
] as const;

export type OperationsIntent = (typeof OPERATIONS_INTENTS)[number];

export type TimeOfDayWindow = 'morning' | 'afternoon' | 'evening';

export interface BusinessHoursWindow {
  openMinutes: number;
  closeMinutes: number;
}

export interface ParsedMenuService {
  serviceName: string;
  durationMinutes: number;
  price: number;
}

export interface ParsedPriceAdjustment {
  /** Relative percent delta (e.g. +10 => 10%). Mutually exclusive with amountChange. */
  percentChange?: number;
  /** Absolute currency delta (e.g. +5 dollars). Mutually exclusive with percentChange. */
  amountChange?: number;
  categoryHint?: string;
  serviceNameHint?: string;
  effectiveFrom?: string;
}

export interface RevenueForecastResult {
  grossRevenue: number;
  expectedRevenue: number;
  noShowRatePercent: number;
  bookingCount: number;
}

/** ai-b3 — no-show sweep with slot release and rebooking suggestions. */
export function isNoShowRecoveryPrompt(prompt: string): boolean {
  return (
    /\b(mark|flag|set).+no[\s-]?show/i.test(prompt) &&
    /release|rebook|waitlist|slot|suggest|message|recover/i.test(prompt)
  );
}

/** ai-b4 — enrich payment sweep filters from natural language. */
export function enrichPaymentSweepParams(
  prompt: string,
  params: Record<string, unknown>,
): Record<string, unknown> {
  const enriched = { ...params };
  if (
    /\bexcept\s+walk[\s-]?ins?\b/i.test(prompt) ||
    /\bwalk[\s-]?ins?\s+except/i.test(prompt) ||
    /\bno\s+walk[\s-]?ins?\b/i.test(prompt)
  ) {
    enriched.excludeWalkIns = true;
  }
  if (/\bcompleted\b/i.test(prompt) && !/\bin[\s-]?progress\b/i.test(prompt)) {
    enriched.statusFilter = BookingStatus.COMPLETED;
  }
  return enriched;
}

export function filterBookingsForPaymentSweep<
  T extends { customerId?: string | null; status: string },
>(bookings: T[], params: Record<string, unknown>): T[] {
  let filtered = bookings;
  if (params.excludeWalkIns) {
    filtered = filtered.filter((b) => b.customerId != null);
  }
  if (params.statusFilter) {
    filtered = filtered.filter((b) => b.status === params.statusFilter);
  }
  return filtered;
}

/** ai-b5 — sick-day cancel + urgent redistribution. */
export function isSickDayReplanPrompt(prompt: string): boolean {
  return (
    (/\b(?:sick|ill|absent|out\s+sick|called\s+in\s+sick)\b/i.test(prompt) ||
      /can't\s+work|cannot\s+work/i.test(prompt)) &&
    (/\bcancel/i.test(prompt) ||
      /\bredistribut/i.test(prompt) ||
      /\burgent/i.test(prompt))
  );
}

export function parseSickEmployeeName(
  prompt: string,
  params: Record<string, unknown>,
): string | undefined {
  if (typeof params.employeeName === 'string' && params.employeeName.trim()) {
    return params.employeeName.trim();
  }
  const match =
    prompt.match(
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+is\s+(?:sick|ill|absent)/i,
    ) ??
    prompt.match(
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:called\s+in\s+sick|out\s+sick)/i,
    );
  return match?.[1]?.trim();
}

/** ai-o1 — catalog import from menu text / photo OCR output. */
export function isImportServicesFromMenuPrompt(prompt: string): boolean {
  if (
    /\bpost[- ]?checkout\b/i.test(prompt) &&
    /\b(?:recommendation|product)\b/i.test(prompt)
  ) {
    return false;
  }
  // e2e-bug.251 — "Add a new catalog category named X" is create_service_category.
  // Bare "catalog" in "catalog category" must not steal the menu/OCR import rescue.
  const hasMenuImportSignal =
    /\b(?:menu|photo|image|ocr)\b/i.test(prompt) ||
    /\bfrom\s+(?:the\s+)?menu\b/i.test(prompt) ||
    /\bscan\s+(?:the\s+)?menu\b/i.test(prompt) ||
    /\bimport\b.+\b(?:from\s+)?(?:the\s+)?catalog\b/i.test(prompt);
  if (
    /\b(?:service|catalog)\s+category\b/i.test(prompt) &&
    !hasMenuImportSignal
  ) {
    return false;
  }
  if (
    /\b(?:add|create)\s+(?:a\s+)?(?:new\s+)?category\b/i.test(prompt) &&
    !hasMenuImportSignal
  ) {
    return false;
  }
  return (
    /\b(import|add|create)\b.+\b(?:menu|catalog|photo|image|ocr)\b/i.test(
      prompt,
    ) ||
    /\bfrom\s+(?:the\s+)?menu\b/i.test(prompt) ||
    /\bscan\s+(?:the\s+)?menu\b/i.test(prompt)
  );
}

const MENU_LINE_RE =
  /([A-Za-z][A-Za-z0-9\s&'-]{1,40}?)\s*(?:[-–—:]\s*)?(\d+)\s*(?:min(?:ute)?s?|m)\b[^$€£₽]*?[$€£₽]?\s*(\d+(?:\.\d{1,2})?)/i;

export function parseMenuTextToServices(text: string): ParsedMenuService[] {
  const lines = text
    .split(/\n|;/)
    .map((l) => l.trim())
    .filter(Boolean);
  const services: ParsedMenuService[] = [];

  for (const line of lines) {
    const match = line.match(MENU_LINE_RE);
    if (!match) continue;
    const serviceName = match[1].trim();
    const durationMinutes = Number.parseInt(match[2], 10);
    const price = Number.parseFloat(match[3]);
    services.push({ serviceName, durationMinutes, price });
  }

  return services;
}

export function extractMenuTextFromParams(
  prompt: string,
  params: Record<string, unknown>,
): string | null {
  if (typeof params.menuText === 'string' && params.menuText.trim()) {
    return params.menuText.trim();
  }
  if (typeof params.ocrText === 'string' && params.ocrText.trim()) {
    return params.ocrText.trim();
  }
  const quoted = prompt.match(/["']([^"']{10,})["']/);
  if (quoted?.[1]) return quoted[1].trim();
  return null;
}

/** ai-o2 — bulk price adjustment. */
export function isPricingAdjustmentPrompt(prompt: string): boolean {
  return (
    /\b(raise|increase|lower|decrease|adjust|change)\b.+\bprice/i.test(
      prompt,
    ) ||
    (/\b\d+\s*%/i.test(prompt) && /\bprice/i.test(prompt))
  );
}

function priceAdjustmentScopeHints(
  prompt: string,
  params: Record<string, unknown>,
): Pick<
  ParsedPriceAdjustment,
  'categoryHint' | 'serviceNameHint' | 'effectiveFrom'
> {
  const categoryHint =
    (typeof params.categoryName === 'string' && params.categoryName) ||
    (typeof params.serviceCategory === 'string' && params.serviceCategory) ||
    prompt.match(/\ball\s+([a-z]+)\s+price/i)?.[1] ||
    prompt.match(/\b([a-z]+)\s+services?\s+price/i)?.[1] ||
    undefined;

  const serviceNameHint =
    typeof params.serviceName === 'string' ? params.serviceName : undefined;

  const effectiveFrom =
    (typeof params.effectiveFrom === 'string' && params.effectiveFrom) ||
    (typeof params.date === 'string' && params.date) ||
    prompt.match(/\bfrom\s+([A-Za-z]+\s+\d{1,2}|\d{4}-\d{2}-\d{2})/i)?.[1] ||
    undefined;

  return {
    categoryHint: categoryHint?.trim() || undefined,
    serviceNameHint: serviceNameHint?.trim() || undefined,
    effectiveFrom: effectiveFrom?.trim() || undefined,
  };
}

function signPriceDelta(prompt: string, value: number): number {
  return /\b(lower|decrease|reduce|cut|drop)\b/i.test(prompt) && value > 0
    ? -value
    : value;
}

/** True when the prompt clearly asks for a flat currency delta, not a percent. */
export function isAbsolutePriceAmountPrompt(prompt: string): boolean {
  if (/\d+(?:\.\d+)?\s*%/.test(prompt)) return false;
  return (
    /\b(?:dollars?|usd|eur|amd|gbp|₽|֏)\b/i.test(prompt) ||
    /(?:by|of|to)\s*\$\s*\d+(?:\.\d+)?/i.test(prompt) ||
    /\$\s*\d+(?:\.\d+)?/.test(prompt)
  );
}

function extractAbsolutePriceAmount(
  prompt: string,
  params: Record<string, unknown>,
): number | null {
  const fromParams =
    params.amountChange ??
    params.priceChangeAmount ??
    params.absoluteChange ??
    params.priceDelta;
  if (fromParams != null) {
    const n = Number.parseFloat(String(fromParams));
    if (Number.isFinite(n)) return n;
  }
  const match =
    prompt.match(
      /(?:by|of)\s*\$?\s*(\d+(?:\.\d+)?)\s*(?:dollars?|usd|eur|amd|gbp)?\b/i,
    ) ||
    prompt.match(/\$\s*(\d+(?:\.\d+)?)/) ||
    prompt.match(/(\d+(?:\.\d+)?)\s*(?:dollars?|usd|eur|amd|gbp)\b/i);
  if (!match?.[1]) return null;
  const n = Number.parseFloat(match[1]);
  return Number.isFinite(n) ? n : null;
}

export function parsePriceAdjustment(
  prompt: string,
  params: Record<string, unknown>,
): ParsedPriceAdjustment | null {
  const scope = priceAdjustmentScopeHints(prompt, params);

  // e2e-bug.164 — "by 5 dollars" must NOT be treated as percentChange=5
  // (that silently turns $20 → $21). Prefer absolute currency deltas whenever
  // the prompt/params use money units, even if the classifier also filled percentChange.
  if (
    isAbsolutePriceAmountPrompt(prompt) ||
    params.amountChange != null ||
    params.priceChangeAmount != null ||
    params.absoluteChange != null ||
    params.priceDelta != null
  ) {
    const amount = extractAbsolutePriceAmount(prompt, params);
    if (amount != null) {
      return {
        amountChange: signPriceDelta(prompt, amount),
        ...scope,
      };
    }
  }

  const percentRaw =
    params.percentChange ??
    params.priceChangePercent ??
    prompt.match(/([+-]?\d+(?:\.\d+)?)\s*%/)?.[1];
  const percentChange =
    percentRaw != null ? Number.parseFloat(String(percentRaw)) : NaN;
  if (!Number.isFinite(percentChange)) return null;

  return {
    percentChange: signPriceDelta(prompt, percentChange),
    ...scope,
  };
}

export function applyPriceAdjustment(
  price: number,
  percentOrAdjustment:
    | number
    | Pick<ParsedPriceAdjustment, 'percentChange' | 'amountChange'>,
): number {
  if (typeof percentOrAdjustment === 'number') {
    const next = price * (1 + percentOrAdjustment / 100);
    return Math.round(next * 100) / 100;
  }
  if (
    percentOrAdjustment.amountChange != null &&
    Number.isFinite(percentOrAdjustment.amountChange)
  ) {
    return Math.round((price + percentOrAdjustment.amountChange) * 100) / 100;
  }
  if (
    percentOrAdjustment.percentChange != null &&
    Number.isFinite(percentOrAdjustment.percentChange)
  ) {
    const next = price * (1 + percentOrAdjustment.percentChange / 100);
    return Math.round(next * 100) / 100;
  }
  return Math.round(price * 100) / 100;
}

/** ai-o3 — staff-service matrix by seniority + category. */
export function isStaffServiceMatrixPrompt(prompt: string): boolean {
  if (isConfigureServiceOnlinePaymentPrompt(prompt)) return false;
  if (/\bcurrenc/i.test(prompt)) return false;
  if (
    /\bto\s+(?:service\s+)?provider\s+[A-Za-z]/i.test(prompt) ||
    (/\bto\s+[A-Za-z][\w]+(?:\s+[A-Za-z][\w]+)?\s*$/i.test(prompt) &&
      !/\b(?:senior|junior)\b/i.test(prompt))
  ) {
    if (
      /\ball\s+(?:the\s+)?services?\s+(?:from|in|under)\b/i.test(prompt) ||
      /\ball\s+[A-Za-z][\w&'-]+\s+services?\b/i.test(prompt) ||
      /\bservice\s+category\s+[A-Za-z]/i.test(prompt)
    ) {
      return false;
    }
  }
  return /\bassign\b.+\b(?:senior|junior|only|matrix)\b/i.test(prompt);
}

export function resolveEmployeesBySeniority<
  T extends { id: string; name: string; metadata?: Record<string, unknown> },
>(employees: T[], level: 'senior' | 'junior'): T[] {
  const isSenior = (e: T) =>
    e.metadata?.seniority === 'senior' ||
    e.metadata?.level === 'senior' ||
    /\bsenior\b/i.test(String(e.metadata?.title ?? '')) ||
    /\bsenior\b/i.test(e.name);

  const isJunior = (e: T) =>
    e.metadata?.seniority === 'junior' ||
    e.metadata?.level === 'junior' ||
    /\bjunior\b/i.test(String(e.metadata?.title ?? '')) ||
    /\bjunior\b/i.test(e.name);

  if (level === 'senior') {
    const seniors = employees.filter(isSenior);
    return seniors.length > 0 ? seniors : employees;
  }
  return employees.filter(isJunior);
}

export function resolveServicesByCategoryHint<
  T extends { id: string; name: string; category?: { name: string } | null },
>(services: T[], hint: string): T[] {
  const lower = hint.toLowerCase().trim();
  if (!lower) return services;
  const matched = services.filter(
    (s) =>
      s.name.toLowerCase().includes(lower) ||
      s.category?.name?.toLowerCase().includes(lower),
  );
  return matched.length > 0 ? matched : services;
}

export function mergeServiceIds(
  existing: string[] | null | undefined,
  add: string[],
): string[] {
  const base = existing ?? [];
  return [...new Set([...base, ...add])];
}

export function removeServiceIds(
  existing: string[] | null | undefined,
  remove: string[],
): string[] {
  const removeSet = new Set(remove);
  return (existing ?? []).filter((id) => !removeSet.has(id));
}

/** ai-o4 — appointments outside business hours. */
export function isComplianceCheckPrompt(prompt: string): boolean {
  return (
    /\b(?:outside|beyond)\b.+\b(?:business\s+hours|operating\s+hours)\b/i.test(
      prompt,
    ) ||
    (/\bcompliance\b/i.test(prompt) && /\bhour/i.test(prompt)) ||
    /\bappointments?\s+outside\b/i.test(prompt)
  );
}

function parseTimeToMinutes(value: string): number {
  const normalized = value.trim().replace(/\./g, ':');
  const [h, m = '0'] = normalized.split(':');
  const hours = Number.parseInt(h, 10);
  const minutes = Number.parseInt(m, 10);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 9 * 60;
  return hours * 60 + minutes;
}

export function parseBusinessHoursWindow(
  settings: Record<string, unknown> | undefined,
): BusinessHoursWindow {
  const hours = settings?.hours ?? settings?.businessHours;
  if (typeof hours === 'string') {
    const parts = hours.split(/[–—-]/).map((p) => p.trim());
    if (parts.length >= 2) {
      return {
        openMinutes: parseTimeToMinutes(parts[0]),
        closeMinutes: parseTimeToMinutes(parts[1]),
      };
    }
  }
  if (hours && typeof hours === 'object') {
    const record = hours as Record<string, unknown>;
    const open = String(record.open ?? record.start ?? '09:00');
    const close = String(record.close ?? record.end ?? '19:00');
    return {
      openMinutes: parseTimeToMinutes(open),
      closeMinutes: parseTimeToMinutes(close),
    };
  }
  return { openMinutes: 9 * 60, closeMinutes: 19 * 60 };
}

export function isBookingOutsideBusinessHours(
  startTime: Date,
  endTime: Date,
  window: BusinessHoursWindow,
): boolean {
  const startMinutes = startTime.getUTCHours() * 60 + startTime.getUTCMinutes();
  const endMinutes = endTime.getUTCHours() * 60 + endTime.getUTCMinutes();
  return startMinutes < window.openMinutes || endMinutes > window.closeMinutes;
}

/** ai-o5 — revenue forecast from schedule + historical no-show rate. */
export function isRevenueForecastPrompt(prompt: string): boolean {
  return (
    /\b(?:forecast|project|predict)\b.+\brevenue\b/i.test(prompt) ||
    /\brevenue\b.+\b(?:next\s+week|forecast|projection)/i.test(prompt)
  );
}

export function computeRevenueForecast(
  scheduledBookings: Array<{ price: number }>,
  historicalNoShowRatePercent: number,
): RevenueForecastResult {
  const grossRevenue = scheduledBookings.reduce((sum, b) => sum + b.price, 0);
  const rate = Math.min(100, Math.max(0, historicalNoShowRatePercent));
  const expectedRevenue =
    Math.round(grossRevenue * (1 - rate / 100) * 100) / 100;
  return {
    grossRevenue: Math.round(grossRevenue * 100) / 100,
    expectedRevenue,
    noShowRatePercent: rate,
    bookingCount: scheduledBookings.length,
  };
}

/** ai-o5 — morning / afternoon / evening availability windows. */
export function parseTimeOfDayWindow(
  prompt: string,
  params: Record<string, unknown>,
): TimeOfDayWindow | null {
  const raw = params.timeOfDay ?? params.dayPart;
  if (typeof raw === 'string') {
    const lower = raw.toLowerCase();
    if (lower === 'morning' || lower === 'afternoon' || lower === 'evening') {
      return lower;
    }
  }
  if (/\bmorning\b/i.test(prompt)) return 'morning';
  if (/\bafternoon\b/i.test(prompt)) return 'afternoon';
  if (/\b(evening|tonight)\b/i.test(prompt)) return 'evening';
  if (/(?:առավոտ|утр[оа]?м|утром|\butrom\b|\baravot\b)/iu.test(prompt)) {
    return 'morning';
  }
  if (/(?:ցերեկ|дн[её]м|\bdnyom\b|\btserek\b)/iu.test(prompt)) {
    return 'afternoon';
  }
  if (
    /(?:երեկոյան|երեկո|вечером|вечер|\bvecherom\b|\bvecher\b|\berek\b)/iu.test(
      prompt,
    )
  ) {
    return 'evening';
  }
  return null;
}

export function timeToMinutes(hhmm: string): number {
  const [h, m = '0'] = hhmm.split(':');
  return Number.parseInt(h, 10) * 60 + Number.parseInt(m, 10);
}

export function slotOverlapsTimeWindow(
  startHHMM: string,
  endHHMM: string | undefined,
  window: TimeOfDayWindow,
): boolean {
  const start = timeToMinutes(startHHMM);
  const end = endHHMM ? timeToMinutes(endHHMM) : start + 30;
  const windows: Record<TimeOfDayWindow, { from: number; to: number }> = {
    morning: { from: 0, to: 12 * 60 },
    afternoon: { from: 12 * 60, to: 17 * 60 },
    evening: { from: 17 * 60, to: 24 * 60 },
  };
  const range = windows[window];
  return start < range.to && end > range.from;
}

export function filterSlotsByTimeOfDay<
  T extends { start: string; end?: string },
>(slots: T[], window: TimeOfDayWindow): T[] {
  return slots.filter((slot) =>
    slotOverlapsTimeWindow(slot.start, slot.end, window),
  );
}

export function formatTimeOfDayLabel(window: TimeOfDayWindow): string {
  if (window === 'morning') return 'morning (before 12:00)';
  if (window === 'afternoon') return 'afternoon (12:00–17:00)';
  return 'evening (after 17:00)';
}

export function rescueOperationsIntent(
  prompt: string,
  action: string,
  params: Record<string, unknown>,
): {
  action: string;
  params: Record<string, unknown>;
  rescueReason?: string;
} | null {
  if (isNoShowRecoveryPrompt(prompt) && action !== 'no_show_recovery') {
    return { action: 'no_show_recovery', params };
  }
  if (isSickDayReplanPrompt(prompt) && action !== 'sick_day_replan') {
    const employeeName = parseSickEmployeeName(prompt, params);
    return {
      action: 'sick_day_replan',
      params: employeeName ? { ...params, employeeName } : params,
    };
  }
  if (
    isImportServicesFromMenuPrompt(prompt) &&
    action !== 'import_services_from_menu'
  ) {
    return { action: 'import_services_from_menu', params };
  }
  const priceOnlinePayment = rescueUpdateServicePricesOnlinePaymentFilterIntent(
    prompt,
    action,
  );
  if (priceOnlinePayment) {
    const adjustment = parsePriceAdjustment(prompt, params);
    return {
      action: priceOnlinePayment.action,
      params: {
        ...enrichUpdateServicePricesParamsFromPrompt(params, prompt),
        ...priceAdjustmentParamsFromParsed(adjustment),
      },
      rescueReason: priceOnlinePayment.rescueReason,
    };
  }
  if (isPricingAdjustmentPrompt(prompt) && action !== 'update_service_prices') {
    const adjustment = parsePriceAdjustment(prompt, params);
    return {
      action: 'update_service_prices',
      params: {
        ...enrichUpdateServicePricesParamsFromPrompt(params, prompt),
        ...priceAdjustmentParamsFromParsed(adjustment),
      },
    };
  }
  const transfer = rescueTransferServicesBetweenProvidersIntent(
    prompt,
    action,
    params,
  );
  if (transfer) {
    return { action: transfer.action, params: transfer.params };
  }
  const unassign = rescueUnassignServicesFromProviderIntent(
    prompt,
    action,
    params,
  );
  if (unassign) {
    return { action: unassign.action, params: unassign.params };
  }
  const categoryAssign = rescueAssignCategoryToProviderIntent(
    prompt,
    action,
    params,
  );
  if (categoryAssign) {
    return { action: categoryAssign.action, params: categoryAssign.params };
  }
  if (isStaffServiceMatrixPrompt(prompt) && action !== 'staff_service_matrix') {
    return { action: 'staff_service_matrix', params };
  }
  if (
    isComplianceCheckPrompt(prompt) &&
    action !== 'check_schedule_compliance'
  ) {
    return { action: 'check_schedule_compliance', params };
  }
  if (isRevenueForecastPrompt(prompt) && action !== 'revenue_forecast') {
    return { action: 'revenue_forecast', params };
  }

  if (action === 'payment_sweep') {
    return {
      action: 'payment_sweep',
      params: enrichPaymentSweepParams(prompt, params),
    };
  }
  if (action === 'update_service_prices') {
    const enriched = enrichUpdateServicePricesParamsFromPrompt(params, prompt);
    const adjustment = parsePriceAdjustment(prompt, enriched);
    const withAdjustment = {
      ...enriched,
      ...priceAdjustmentParamsFromParsed(adjustment),
    };
    // Drop classifier percentChange when the prompt is clearly a dollar delta
    // so execution cannot fall back to the wrong unit.
    if (adjustment?.amountChange != null) {
      delete withAdjustment.percentChange;
      delete withAdjustment.priceChangePercent;
    }
    if (JSON.stringify(withAdjustment) !== JSON.stringify(params)) {
      return { action: 'update_service_prices', params: withAdjustment };
    }
  }
  if (action === 'check_availability') {
    const timeOfDay = parseTimeOfDayWindow(prompt, params);
    if (timeOfDay)
      return { action: 'check_availability', params: { ...params, timeOfDay } };
  }

  return null;
}

/** Flatten a parsed price adjustment into classifier/handler params. */
export function priceAdjustmentParamsFromParsed(
  adjustment: ParsedPriceAdjustment | null,
): Record<string, unknown> {
  if (!adjustment) return {};
  return {
    ...(adjustment.amountChange != null
      ? { amountChange: adjustment.amountChange }
      : {}),
    ...(adjustment.percentChange != null
      ? { percentChange: adjustment.percentChange }
      : {}),
    ...(adjustment.categoryHint
      ? { categoryName: adjustment.categoryHint }
      : {}),
    ...(adjustment.effectiveFrom
      ? { effectiveFrom: adjustment.effectiveFrom }
      : {}),
    ...(adjustment.serviceNameHint
      ? { serviceName: adjustment.serviceNameHint }
      : {}),
  };
}

export function mapOperationsOrchestrationResult(result: {
  success: boolean;
  action: string;
  summary: string;
  details?: Record<string, unknown>;
  taskId?: string;
  requiresApproval?: boolean;
}) {
  return {
    success: result.success,
    action: result.action,
    summary: result.summary,
    details: {
      ...(result.details ?? {}),
      taskId: result.taskId,
      requiresApproval: result.requiresApproval,
    },
  };
}

export function shouldAutoExecuteOperations(
  intent: string,
  stepCount: number,
): boolean {
  if (
    intent === 'import_services_from_menu' ||
    intent === 'no_show_recovery' ||
    intent === 'sick_day_replan'
  ) {
    return false;
  }
  if (intent === 'update_service_prices' || intent === 'staff_service_matrix') {
    return stepCount <= 5;
  }
  return false;
}

/**
 * The reads inside this list — e2e-bug.376, second wave.
 *
 * The registry binding passes the whole intent list as its own `mutateIntents`,
 * so every member is registered `mutating: true`. §110 fixed that pattern for
 * `PROVIDER_PAYMENTS_INTENTS` and checked the other bindings for reads by
 * looking for read *verbs* (`explain_`, `list_`, `get_`, `summarize_`). These
 * are named as nouns — `revenue_forecast`, `staff_service_matrix`,
 * `delivery_queue` — so the check missed them.
 *
 * Excluded from the mutate list rather than removed from the intent list: they
 * are real commands on this surface, they simply do not write.
 */
export const OPERATIONS_READ_ONLY_INTENTS: readonly string[] = [
  'check_schedule_compliance',
  'revenue_forecast',
  // NOT `staff_service_matrix`, though its spec describes a read ("Show which
  // staff can perform which services", `confirm: 'never'`). It is listed
  // explicitly in two inline `mutateIntents` arrays and in
  // `DASHBOARD_EXECUTION_CONFIRM_ACTIONS`, and production shows it going through
  // the approval path. Two authors deliberately marked it a mutation; the other
  // five here were swept in mechanically by a whole-list-as-mutate-list binding.
  // Reclassifying it would remove a confirmation gate on the strength of a
  // description, which is the wrong direction to be wrong in. Left for
  // e2e-bug.405's review, where the spec/runtime confirmation disagreement is
  // already the subject.
];
