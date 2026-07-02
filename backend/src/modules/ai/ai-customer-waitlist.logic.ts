import type { CommandResult } from './command-completion.types.js';
import type { SelfServiceBookingLogicDeps } from './ai-self-service-booking.logic.js';
import type { PublicCustomerWaitlistService } from '../public-booking/public-customer-waitlist.service.js';
import {
  buildCheckWaitlistStatusSummary,
  buildJoinWaitlistSuccessSummary,
} from '../../common/utils/customer-waitlist.util.js';
import {
  enrichJoinWaitlistParamsFromPrompt,
  parseCheckWaitlistStatusFromPrompt,
  parseJoinWaitlistFromPrompt,
} from './ai-customer-waitlist.util.js';

export interface CustomerWaitlistLogicDeps extends SelfServiceBookingLogicDeps {
  publicCustomerWaitlistService: Pick<
    PublicCustomerWaitlistService,
    'joinWaitlist' | 'getWaitlistStatus'
  >;
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

function resolveSessionCustomerId(
  params: Record<string, unknown>,
): string | undefined {
  const raw = params.sessionCustomerId ?? params.customerId;
  return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined;
}

async function resolveBusinessSlug(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
): Promise<string | null> {
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  return business?.slug ?? null;
}

async function resolveServiceIdByName(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  serviceName?: string,
): Promise<string | undefined> {
  if (!serviceName?.trim()) return undefined;
  const normalized = serviceName.trim().toLowerCase();
  const service = await deps.serviceRepo
    .createQueryBuilder('service')
    .where('service.businessId = :businessId', { businessId })
    .andWhere('LOWER(service.name) = :name', { name: normalized })
    .getOne();
  return service?.id;
}

export async function handleJoinWaitlistLogic(
  deps: CustomerWaitlistLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt = '',
): Promise<CommandResult> {
  const textPrompt = prompt || String(params._prompt ?? '');
  const timeZone = String(params._timeZone ?? 'UTC');
  const parsed = parseJoinWaitlistFromPrompt(textPrompt, params, timeZone);
  if (!parsed) {
    return failure(
      'join_waitlist',
      'Say what service or day you want waitlist alerts for.',
      { clarify: true },
    );
  }

  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure(
      'join_waitlist',
      'Sign in to join the waitlist and get notified when a slot opens.',
      { clarify: true },
    );
  }

  const slug = await resolveBusinessSlug(deps, businessId);
  if (!slug) return failure('join_waitlist', 'Business not found.');

  const enriched = enrichJoinWaitlistParamsFromPrompt(
    params,
    textPrompt,
    timeZone,
  );
  const serviceId =
    typeof enriched.serviceId === 'string'
      ? enriched.serviceId
      : await resolveServiceIdByName(
          deps,
          businessId,
          parsed.serviceName ?? (enriched.serviceName as string | undefined),
        );

  try {
    const result = await deps.publicCustomerWaitlistService.joinWaitlist(
      slug,
      customerId,
      {
        ...(serviceId ? { serviceId } : {}),
        ...(parsed.serviceName ? { serviceName: parsed.serviceName } : {}),
        ...(parsed.employeeName ? { employeeName: parsed.employeeName } : {}),
        ...(parsed.date ? { date: parsed.date } : {}),
        ...(parsed.dateFrom ? { dateFrom: parsed.dateFrom } : {}),
        ...(parsed.dateTo ? { dateTo: parsed.dateTo } : {}),
        ...(parsed.timeSlot ? { timeSlot: parsed.timeSlot } : {}),
        ...(parsed.timeOfDay ? { timeOfDay: parsed.timeOfDay } : {}),
        ...(parsed.notes ? { notes: parsed.notes } : {}),
      },
    );

    const summary = result.request
      ? buildJoinWaitlistSuccessSummary(result.request)
      : "You're on the waitlist — we'll notify you when a slot opens.";

    return success('join_waitlist', summary, {
      onWaitlist: result.onWaitlist,
      waitlistRequest: result.request,
    });
  } catch (err: any) {
    return failure(
      'join_waitlist',
      err?.message ?? 'Could not join the waitlist.',
    );
  }
}

export async function handleCheckWaitlistStatusLogic(
  deps: CustomerWaitlistLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt = '',
): Promise<CommandResult> {
  const textPrompt = prompt || String(params._prompt ?? '');
  if (!parseCheckWaitlistStatusFromPrompt(textPrompt)) {
    return failure(
      'check_waitlist_status',
      'Ask whether you are on the waitlist.',
      { clarify: true },
    );
  }

  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure(
      'check_waitlist_status',
      'Sign in to check your waitlist status.',
      { clarify: true },
    );
  }

  const slug = await resolveBusinessSlug(deps, businessId);
  if (!slug) return failure('check_waitlist_status', 'Business not found.');

  try {
    const result = await deps.publicCustomerWaitlistService.getWaitlistStatus(
      slug,
      customerId,
    );
    const summary = buildCheckWaitlistStatusSummary(result);
    return success('check_waitlist_status', summary, {
      onWaitlist: result.onWaitlist,
      waitlistRequest: result.request,
    });
  } catch (err: any) {
    return failure(
      'check_waitlist_status',
      err?.message ?? 'Could not check waitlist status.',
    );
  }
}
