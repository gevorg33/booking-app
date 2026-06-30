import type { Repository } from 'typeorm';
import type { BookingCheckoutDraft } from '../booking/entities/booking-checkout-draft.entity.js';
import type { CreatePublicBookingDto } from '../public-booking/dto/public-booking.dto.js';
import type { CommandResult } from './command-completion.types.js';
import {
  buildResumePendingPaymentNavigate,
  parsePendingCheckoutPaymentFromParams,
  parseResumePendingPaymentFromPrompt,
  type PendingCheckoutPaymentContext,
} from './ai-resume-pending-payment.util.js';

export interface ResumePendingPaymentLogicDeps {
  draftRepo: Pick<Repository<BookingCheckoutDraft>, 'findOne'>;
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

function readPayloadField(
  payload: Record<string, unknown>,
  key: keyof CreatePublicBookingDto,
): string | undefined {
  const value = payload[key as string];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function resolvePendingContext(
  params: Record<string, unknown>,
  draft?: BookingCheckoutDraft | null,
): PendingCheckoutPaymentContext | null {
  const fromParams = parsePendingCheckoutPaymentFromParams(params);
  if (!draft) return fromParams;

  const payload = (draft.payload ?? {}) as Record<string, unknown>;
  const sessionId = fromParams?.sessionId ?? draft.stripeSessionId ?? undefined;
  const serviceId = fromParams?.serviceId ?? readPayloadField(payload, 'serviceId');
  const startTime = fromParams?.startTime ?? readPayloadField(payload, 'startTime');
  const employeeId =
    fromParams?.employeeId ?? readPayloadField(payload, 'employeeId');

  if (!sessionId || !serviceId || !startTime) return fromParams;
  return { sessionId, serviceId, startTime, employeeId };
}

export async function handleResumePendingPaymentLogic(
  deps: ResumePendingPaymentLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const parsed = parseResumePendingPaymentFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'resume_pending_payment',
      'Ask to restore an in-progress payment (e.g. "Continue my payment" or "I closed the app mid-checkout").',
      { clarify: true },
    );
  }

  const pendingFromDevice = parsePendingCheckoutPaymentFromParams(params);
  const draft = pendingFromDevice?.sessionId
    ? await deps.draftRepo.findOne({
        where: {
          stripeSessionId: pendingFromDevice.sessionId,
          businessId,
        },
      })
    : null;

  const pending = resolvePendingContext(params, draft);
  if (!pending) {
    return failure(
      'resume_pending_payment',
      'No saved checkout payment was found on this device. Pick a time slot and start checkout again.',
      {
        clarify: true,
        missing: [
          'pendingCheckoutSessionId',
          'pendingCheckoutServiceId',
          'pendingCheckoutStartTime',
        ],
      },
    );
  }

  if (draft) {
    if (draft.status === 'completed') {
      return failure(
        'resume_pending_payment',
        'That payment already completed. Check Account → My bookings for your confirmation.',
        { sessionId: pending.sessionId, draftStatus: draft.status },
      );
    }
    if (draft.expiresAt.getTime() < Date.now()) {
      return failure(
        'resume_pending_payment',
        'That checkout payment session expired. Pick a new time and start checkout again.',
        { sessionId: pending.sessionId, draftStatus: draft.status },
      );
    }
  }

  const navigate = buildResumePendingPaymentNavigate(pending);
  return success(
    'resume_pending_payment',
    'Taking you back to your in-progress checkout so you can finish payment.',
    {
      pendingCheckoutPayment: pending,
      navigate,
      sessionContext: {
        serviceId: pending.serviceId,
        timeSlot: pending.startTime,
        ...(pending.employeeId ? { employeeId: pending.employeeId } : {}),
      },
      ...(draft
        ? {
            draftId: draft.id,
            draftStatus: draft.status,
            amount: Number(draft.amount),
            currency: draft.currency,
          }
        : {}),
    },
  );
}
