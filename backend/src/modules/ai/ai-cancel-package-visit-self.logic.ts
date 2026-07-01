import type { Repository } from 'typeorm';
import type { Business } from '../business/entities/business.entity.js';
import type { PublicCustomerBookingService } from '../public-booking/public-customer-booking.service.js';
import type { PublicCustomerAuthService } from '../public-booking/public-customer-auth.service.js';
import type { PublicCustomerBookingItem } from '../public-booking/public-customer-auth.types.js';
import type { CommandResult } from './command-completion.types.js';
import {
  buildCancelPackageVisitSelfAmbiguousSummary,
  buildCancelPackageVisitSelfNavigate,
  enrichCancelPackageVisitSelfParamsFromPrompt,
  isCancelPackageVisitSelfPrompt,
  matchCustomerOwnedPackageVisit,
  parseCancelPackageVisitSelfFromPrompt,
} from './ai-cancel-package-visit-self.util.js';

export interface CancelPackageVisitSelfLogicDeps {
  businessRepo: Pick<Repository<Business>, 'findOne'>;
  publicCustomerBookingService: Pick<
    PublicCustomerBookingService,
    'cancelPackageVisit'
  >;
  publicCustomerAuthService: Pick<PublicCustomerAuthService, 'listBookings'>;
}

function resolveSessionCustomerId(
  params: Record<string, unknown>,
): string | undefined {
  return (
    (params.sessionCustomerId as string | undefined) ??
    (params.customerId as string | undefined)
  );
}

function failure(
  action: string,
  summary: string,
  details: Record<string, unknown> = {},
): CommandResult {
  return { success: false, action, summary, details };
}

function success(
  action: string,
  summary: string,
  details: Record<string, unknown> = {},
): CommandResult {
  return { success: true, action, summary, details };
}

async function resolveBusinessSlug(
  deps: CancelPackageVisitSelfLogicDeps,
  businessId: string,
): Promise<string | null> {
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  return business?.slug ?? null;
}

export async function handleCancelPackageVisitSelfLogic(
  deps: CancelPackageVisitSelfLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt = '',
): Promise<CommandResult> {
  const effectivePrompt = String(prompt || params._prompt || '');
  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure(
      'cancel_package_visit_self',
      'Sign in to cancel your package visit.',
      { clarify: true, missing: ['customerId'] },
    );
  }

  const enriched = enrichCancelPackageVisitSelfParamsFromPrompt(
    params,
    effectivePrompt,
  );
  const hasExplicitTarget = Boolean(
    enriched.bookingId || enriched.packageName || enriched.visitIndex != null,
  );

  if (
    effectivePrompt &&
    effectivePrompt !== 'cancel_package_visit_self' &&
    !hasExplicitTarget &&
    !parseCancelPackageVisitSelfFromPrompt(effectivePrompt, enriched)
  ) {
    return failure(
      'cancel_package_visit_self',
      'Say which package visit to cancel — for example "Cancel visit 2 of my package" or "Skip my next package visit".',
      { clarify: true },
    );
  }

  const slug = await resolveBusinessSlug(deps, businessId);
  if (!slug) {
    return failure('cancel_package_visit_self', 'Business not found.');
  }

  const { bookings } = await deps.publicCustomerAuthService.listBookings(
    slug,
    customerId,
  );
  const matched = matchCustomerOwnedPackageVisit(bookings, enriched);

  if (matched.ambiguous.length > 1) {
    return failure(
      'cancel_package_visit_self',
      buildCancelPackageVisitSelfAmbiguousSummary(matched.ambiguous),
      {
        clarify: true,
        missing: ['bookingId'],
        candidates: matched.ambiguous.map((row) => ({
          bookingId: row.id,
          packageName: row.packageName ?? row.serviceName ?? null,
          startTime: row.startTime,
          visitIndex: enriched.visitIndex ?? null,
        })),
        navigate: buildCancelPackageVisitSelfNavigate(),
      },
    );
  }

  const booking = matched.booking;
  if (!booking) {
    return failure(
      'cancel_package_visit_self',
      'No upcoming package visit found to cancel.',
      {
        clarify: true,
        navigate: buildCancelPackageVisitSelfNavigate(),
      },
    );
  }

  try {
    const { bookings: cancelled } =
      await deps.publicCustomerBookingService.cancelPackageVisit(
        slug,
        customerId,
        booking.id,
      );
    return success(
      'cancel_package_visit_self',
      `Cancelled package visit (${cancelled.length} appointment(s)).`,
      {
        bookingIds: cancelled.map((row) => row.id),
        packagePurchaseId: booking.packagePurchaseId ?? null,
        navigate: buildCancelPackageVisitSelfNavigate(booking.id),
      },
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Could not cancel package visit.';
    return failure('cancel_package_visit_self', message, {
      bookingId: booking.id,
    });
  }
}

export function assertCancelPackageVisitSelfPrompt(prompt: string): boolean {
  return isCancelPackageVisitSelfPrompt(prompt);
}
