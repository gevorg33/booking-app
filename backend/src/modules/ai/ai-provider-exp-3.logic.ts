import { In, MoreThanOrEqual, Not, type Repository } from 'typeorm';
import {
  Booking,
  BookingStatus,
} from '../booking/entities/booking.entity.js';
import type { BusinessService } from '../business/business.service.js';
import type { ProviderMobileService } from '../provider-mobile/provider-mobile.service.js';
import type { AiRetailFinanceService } from './ai-retail-finance.service.js';
import type { AiProviderTimeOffService } from './ai-provider-time-off.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  extractBlockWindowFromPrompt,
  extractMessageTemplateHint,
  extractRetailProductName,
  extractSendMessageChannel,
  isProviderExp3Intent,
} from './ai-provider-exp-3.util.js';
import {
  formatDateDisplay,
  formatTimeDisplay,
  getTodayDateKey,
  toIsoDay,
  todayDisplay,
} from '../../common/utils/date-format.util.js';
import { normalizeTime24 } from '../../common/utils/time-format.util.js';
import {
  buildCustomerSmsLinkWithBody,
  buildCustomerWhatsAppLinkWithBody,
  isStaffMessageTemplatesFeatureEnabled,
  listActiveStaffMessageTemplates,
  readStaffMessageTemplatesSettings,
  resolveStaffMessageTemplateBody,
} from '../provider-mobile/provider-staff-message-templates.util.js';
import { mergeBusinessNotificationSettings } from '../notifications/merge-business-notification-settings.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PROVIDER_SELF_BLOCK_PRESETS } from '../provider-mobile/provider-self-block.util.js';
import { extractBookingActionCustomerName } from './ai-provider-exp-2.util.js';

export interface ProviderExp3LogicDeps {
  bookingRepo: Repository<Booking>;
  businessService: BusinessService;
  providerMobile: ProviderMobileService;
  retailFinance: AiRetailFinanceService;
  providerTimeOff: AiProviderTimeOffService;
  notificationsService: NotificationsService;
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

async function resolveBookingForExp3(
  deps: ProviderExp3LogicDeps,
  businessId: string,
  userId: string,
  action: string,
  params: Record<string, unknown>,
  prompt?: string,
  context?: Record<string, unknown>,
): Promise<
  | {
      bookingId: string;
      customerName: string;
      customerPhone: string | null;
      startTime: Date;
    }
  | { error: CommandResult }
> {
  const explicitBookingId =
    (typeof params.bookingId === 'string' && params.bookingId.trim()) ||
    (typeof context?.bookingId === 'string' && context.bookingId.trim()) ||
    null;

  if (explicitBookingId) {
    try {
      const booking = await deps.providerMobile.getBookingDetail(
        businessId,
        userId,
        explicitBookingId,
      );
      return {
        bookingId: explicitBookingId,
        customerName: booking.customer?.name ?? 'Client',
        customerPhone: booking.customer?.phone ?? null,
        startTime: new Date(booking.startTime),
      };
    } catch {
      return {
        error: failure(
          action,
          'Could not find that appointment. Open the booking and try again.',
          { clarify: true },
        ),
      };
    }
  }

  const customerName = extractBookingActionCustomerName(prompt ?? '', params);
  if (!customerName) {
    return {
      error: failure(
        action,
        'Open an appointment or name the client (e.g. "Text Jane running late").',
        { clarify: true, missing: ['bookingId', 'customerName'] },
      ),
    };
  }

  const access = await deps.providerMobile.resolveMobileAccess(
    businessId,
    userId,
  );
  const employeeId = deps.providerMobile.getScopedEmployeeId(access);
  const today = getTodayDateKey();
  const dayStart = new Date(`${today}T00:00:00.000Z`);

  const bookings = await deps.bookingRepo.find({
    where: {
      businessId,
      ...(employeeId ? { employeeId } : {}),
      startTime: MoreThanOrEqual(dayStart),
      status: Not(
        In([
          BookingStatus.CANCELLED,
          BookingStatus.COMPLETED,
          BookingStatus.NO_SHOW,
        ]),
      ),
    },
    relations: { customer: true },
    order: { startTime: 'ASC' },
    take: 50,
  });

  const lower = customerName.toLowerCase();
  const match = bookings.find((row) =>
    row.customer?.name?.toLowerCase().includes(lower),
  );
  if (!match) {
    return {
      error: failure(
        action,
        `No active appointment found for "${customerName}". Open their booking from Today or Calendar.`,
        { clarify: true, customerName },
      ),
    };
  }

  return {
    bookingId: match.id,
    customerName: match.customer?.name ?? customerName,
    customerPhone: match.customer?.phone ?? null,
    startTime: match.startTime,
  };
}

function matchStaffMessageTemplate(
  settings: ReturnType<typeof readStaffMessageTemplatesSettings>,
  hint: string | null,
) {
  const templates = listActiveStaffMessageTemplates(settings);
  if (templates.length === 0) return null;
  if (!hint) return templates[0] ?? null;

  const normalized = hint.toLowerCase();
  return (
    templates.find((template) => template.id.toLowerCase() === normalized) ??
    templates.find((template) =>
      template.label.toLowerCase().includes(normalized),
    ) ??
    templates[0] ??
    null
  );
}

export async function handleSendClientMessageLogic(
  deps: ProviderExp3LogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, unknown>,
  prompt?: string,
  context?: Record<string, unknown>,
): Promise<CommandResult> {
  const resolved = await resolveBookingForExp3(
    deps,
    businessId,
    userId,
    'send_client_message',
    params,
    prompt,
    context,
  );
  if ('error' in resolved) return resolved.error;

  if (!resolved.customerPhone) {
    return failure(
      'send_client_message',
      `${resolved.customerName} has no phone number on file. Add it in CRM or call from the booking detail screen.`,
      { bookingId: resolved.bookingId },
    );
  }

  const business = await deps.businessService.findOne(businessId);
  const settings = (business?.settings ?? {}) as Record<string, unknown>;
  const templateSettings = readStaffMessageTemplatesSettings(settings);
  if (!isStaffMessageTemplatesFeatureEnabled(templateSettings)) {
    return failure(
      'send_client_message',
      'Canned message templates are not enabled. Ask your manager to turn them on in Settings.',
    );
  }

  const notificationSettings = mergeBusinessNotificationSettings(
    settings.notifications as Record<string, unknown> | undefined,
  );
  const providerStatus = deps.notificationsService.getProviderStatus(settings);
  const channel = extractSendMessageChannel(prompt ?? '', params);
  if (
    channel === 'whatsapp' &&
    (!notificationSettings.whatsappEnabled || !providerStatus.whatsappConfigured)
  ) {
    return failure(
      'send_client_message',
      'WhatsApp is not configured for this business. Try SMS instead.',
      { channel },
    );
  }

  const template = matchStaffMessageTemplate(
    templateSettings,
    extractMessageTemplateHint(prompt ?? '', params),
  );
  if (!template) {
    return failure(
      'send_client_message',
      'No message templates are configured.',
    );
  }

  const body = resolveStaffMessageTemplateBody(template.body, {
    customerName: resolved.customerName,
    businessName: business?.name,
    appointmentTime: `${formatDateDisplay(resolved.startTime)} ${formatTimeDisplay(resolved.startTime)}`,
  });

  const link =
    channel === 'whatsapp'
      ? buildCustomerWhatsAppLinkWithBody(resolved.customerPhone, body)
      : buildCustomerSmsLinkWithBody(resolved.customerPhone, body);

  if (!link) {
    return failure(
      'send_client_message',
      'Could not build a message link for this client.',
    );
  }

  return success(
    'send_client_message',
    `Open ${channel === 'whatsapp' ? 'WhatsApp' : 'SMS'} to message ${resolved.customerName} with "${template.label}".`,
    {
      bookingId: resolved.bookingId,
      customerName: resolved.customerName,
      channel,
      templateId: template.id,
      templateLabel: template.label,
      messageBody: body,
      openLink: link,
    },
  );
}

function resolveBlockMyTimeWindow(
  prompt: string,
  params: Record<string, unknown>,
): { date: string; startTime: string; endTime: string; placeholder: string } | null {
  const dateRaw =
    (typeof params.date === 'string' && params.date.trim()) ||
    (typeof params.dateFrom === 'string' && params.dateFrom.trim()) ||
    null;
  const dateKey = dateRaw
    ? /^\d{4}-\d{2}-\d{2}$/.test(dateRaw)
      ? dateRaw
      : toIsoDay(dateRaw)
    : toIsoDay(todayDisplay());

  let startTime =
    (typeof params.timeFrom === 'string' && normalizeTime24(params.timeFrom)) ||
    (typeof params.startTime === 'string' && normalizeTime24(params.startTime)) ||
    null;
  let endTime =
    (typeof params.timeTo === 'string' && normalizeTime24(params.timeTo)) ||
    (typeof params.endTime === 'string' && normalizeTime24(params.endTime)) ||
    null;

  const extracted = extractBlockWindowFromPrompt(prompt);
  if (!startTime && extracted.startTime) {
    startTime = normalizeTime24(extracted.startTime);
  }
  if (!endTime && extracted.endTime) {
    endTime = normalizeTime24(extracted.endTime);
  }

  if (!startTime || !endTime) {
    const lunch = PROVIDER_SELF_BLOCK_PRESETS.find((preset) => preset.id === 'lunch');
    if (/\blunch\b/i.test(prompt) && lunch) {
      startTime = lunch.startTime;
      endTime = lunch.endTime;
    }
    const breakPreset = PROVIDER_SELF_BLOCK_PRESETS.find(
      (preset) => preset.id === 'break',
    );
    if (/\bbreak\b/i.test(prompt) && breakPreset) {
      startTime = breakPreset.startTime;
      endTime = breakPreset.endTime;
    }
  }

  if (!startTime || !endTime) return null;

  const placeholder = /\blunch\b/i.test(prompt)
    ? 'Lunch'
    : /\bbreak\b/i.test(prompt)
      ? 'Break'
      : 'Blocked';

  return { date: dateKey, startTime, endTime, placeholder };
}

export async function handleBlockMyTimeLogic(
  deps: ProviderExp3LogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, unknown>,
  prompt: string,
): Promise<CommandResult> {
  const window = resolveBlockMyTimeWindow(prompt, params);
  if (!window) {
    return failure(
      'block_my_time',
      'Tell me when to block (e.g. "Block my lunch 12:00 to 13:00 today").',
      { clarify: true },
    );
  }

  try {
    const block = await deps.providerMobile.createProviderSelfBlock(
      businessId,
      userId,
      window,
    );
    return success(
      'block_my_time',
      `Blocked ${window.startTime}–${window.endTime} on ${formatDateDisplay(window.date)}.`,
      { block },
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Could not block time on your calendar.';
    return failure('block_my_time', message);
  }
}

export async function handleAddRetailToBookingLogic(
  deps: ProviderExp3LogicDeps,
  businessId: string,
  userId: string,
  employeeId: string | undefined,
  params: Record<string, unknown>,
  prompt?: string,
  context?: Record<string, unknown>,
): Promise<CommandResult> {
  const productName = extractRetailProductName(prompt ?? '', params);
  const mergedParams: Record<string, unknown> = {
    ...params,
    ...context,
    sessionEmployeeId: employeeId,
  };
  if (productName) mergedParams.productName = productName;

  const result = await deps.retailFinance.handleAddRetailToMyBooking(
    businessId,
    mergedParams as Record<string, any>,
    userId,
    prompt,
  );

  return {
    ...result,
    action: 'add_retail_to_booking',
  };
}

export async function dispatchProviderExp3Intent(
  deps: ProviderExp3LogicDeps,
  businessId: string,
  userId: string,
  action: string,
  params: Record<string, unknown>,
  prompt?: string,
  context?: Record<string, unknown>,
  employeeId?: string,
): Promise<CommandResult | null> {
  if (!isProviderExp3Intent(action)) return null;

  switch (action) {
    case 'add_retail_to_booking':
      return handleAddRetailToBookingLogic(
        deps,
        businessId,
        userId,
        employeeId,
        params,
        prompt,
        context,
      );
    case 'send_client_message':
      return handleSendClientMessageLogic(
        deps,
        businessId,
        userId,
        params,
        prompt,
        context,
      );
    case 'block_my_time':
      return handleBlockMyTimeLogic(
        deps,
        businessId,
        userId,
        params,
        prompt ?? '',
      );
    case 'request_time_off':
      return (
        (await deps.providerTimeOff.handleIntent(
          businessId,
          userId,
          action,
          params,
          'provider',
          employeeId,
        )) ?? failure(
          'request_time_off',
          'Could not submit time-off request. Use the Schedule tab or specify dates.',
          { clarify: true },
        )
      );
    default:
      return null;
  }
}
