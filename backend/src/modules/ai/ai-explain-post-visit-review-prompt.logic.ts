import type { CommandResult } from './command-completion.types.js';
import type { SelfServiceBookingLogicDeps } from './ai-self-service-booking.logic.js';
import {
  assemblePostVisitReviewPromptSummary,
  parseExplainPostVisitReviewPromptFromPrompt,
} from './ai-explain-post-visit-review-prompt.util.js';

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

export async function handleExplainPostVisitReviewPromptLogic(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt = '',
): Promise<CommandResult> {
  const textPrompt = prompt || String(params._prompt ?? '');
  const parsed = parseExplainPostVisitReviewPromptFromPrompt(textPrompt);
  if (!parsed) {
    return failure(
      'explain_post_visit_review_prompt',
      'Ask about the post-visit review popup (e.g. "Why am I seeing a review popup?").',
      { clarify: true },
    );
  }

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('explain_post_visit_review_prompt', 'Business not found.');
  }

  let pendingReviewLine: string | null = null;
  let pendingReviewBookingId: string | null = null;
  const customerId = resolveSessionCustomerId(params);
  if (customerId && business.slug) {
    const listed = await deps.publicCustomerAuthService.listBookings(
      business.slug,
      customerId,
    );
    const pending = listed.bookings.find((row) => row.canReview);
    if (pending) {
      pendingReviewBookingId = pending.id;
      pendingReviewLine = `You currently have a completed ${pending.serviceName} visit that can still be reviewed from Account.`;
    }
  }

  const summary = assemblePostVisitReviewPromptSummary(
    parsed.aspect,
    pendingReviewLine,
  );

  return success('explain_post_visit_review_prompt', summary, {
    aspect: parsed.aspect,
    pendingReviewBookingId,
  });
}
