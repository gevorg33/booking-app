import type { PublicBookingService } from '../public-booking/public-booking.service.js';
import type { CommandResult } from './command-completion.types.js';
import { parseShareMyBookingFromPrompt } from './ai-share-my-booking.util.js';

export interface ShareMyBookingLogicDeps {
  publicBookingService: PublicBookingService;
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

export async function handleShareMyBookingLogic(
  deps: ShareMyBookingLogicDeps,
  _businessId: string,
  params: Record<string, unknown>,
  prompt = '',
): Promise<CommandResult> {
  const parsed = parseShareMyBookingFromPrompt(
    prompt || String(params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'share_my_booking',
      'Ask to share a booking (e.g. "Share my appointment with my partner").',
      { clarify: true },
    );
  }

  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure('share_my_booking', 'Sign in to share a booking.', {
      clarify: true,
    });
  }

  const slug = typeof params.slug === 'string' ? params.slug : undefined;
  if (!slug) return failure('share_my_booking', 'Business not found.');

  const view = await deps.publicBookingService.getCustomerShareRewards(
    slug,
    customerId,
  );
  const rewardHint = view.bookingShareEnabled
    ? ` You can earn ${view.bookingRewardSummary} when you share a booking.`
    : '';

  const bookingHint = parsed.bookingId
    ? ' Open My bookings and tap Share booking on that visit.'
    : ' Open Account → My bookings and tap Share booking on a confirmed visit.';

  return success(
    'share_my_booking',
    `Use the native share sheet to send your appointment details.${bookingHint}${rewardHint}`,
    {
      navigate: { path: 'account', query: { section: 'bookings' } },
      bookingShareEnabled: view.bookingShareEnabled,
      bookingId: parsed.bookingId ?? null,
    },
  );
}
