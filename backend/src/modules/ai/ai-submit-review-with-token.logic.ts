import type { ReviewsService } from '../reviews/reviews.service.js';
import type { SubmitPublicReviewDto } from '../reviews/dto/submit-public-review.dto.js';
import type { Repository } from 'typeorm';
import type { Business } from '../business/entities/business.entity.js';
import type { CommandResult } from './command-completion.types.js';
import { resolveBusinessSlugFromParamsOrId } from './ai-resolve-business-slug.util.js';

export interface SubmitReviewWithTokenLogicDeps {
  reviewsService: Pick<ReviewsService, 'getPublicContext' | 'submitPublic'>;
  businessRepo: Pick<Repository<Business>, 'findOne'>;
}

function failure(
  summary: string,
  details: Record<string, unknown> = {},
): CommandResult {
  return {
    success: false,
    action: 'submit_review_with_token',
    summary,
    details,
  };
}

function success(
  summary: string,
  details: Record<string, unknown> = {},
): CommandResult {
  return {
    success: true,
    action: 'submit_review_with_token',
    summary,
    details,
  };
}

export async function handleSubmitReviewWithTokenLogic(
  deps: SubmitReviewWithTokenLogicDeps,
  businessId: string,
  params: Record<string, any> = {},
): Promise<CommandResult> {
  // e2e-bug.82 — resolve slug from businessId when classifier omits params.slug.
  const slug = await resolveBusinessSlugFromParamsOrId(
    deps.businessRepo,
    businessId,
    params,
  );
  if (!slug) return failure('Business not found.');

  const bookingId = params.bookingId as string | undefined;
  const token = params.token as string | undefined;
  if (!bookingId || !token) {
    return failure('Open your review link from email to leave a review.', {
      clarify: true,
      missing: [
        ...(bookingId ? [] : ['bookingId']),
        ...(token ? [] : ['token']),
      ],
    });
  }

  const rating =
    typeof params.rating === 'number' ? params.rating : Number(params.rating);
  if (!rating || Number.isNaN(rating) || rating < 1 || rating > 5) {
    try {
      const context = await deps.reviewsService.getPublicContext(
        slug,
        bookingId,
        token,
      );
      if (context.alreadySubmitted) {
        return success('A review was already submitted for this visit. Thanks!', {
          context,
          alreadySubmitted: true,
        });
      }
      return failure(
        `Rate your ${context.serviceName} visit with ${context.employeeName} from 1 to 5 stars.`,
        { context, clarify: true, missing: ['rating'] },
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'This review link is invalid or expired.';
      return failure(message, { bookingId });
    }
  }

  try {
    const dto: SubmitPublicReviewDto = {
      bookingId,
      token,
      rating,
      comment: params.comment as string | undefined,
      customerName: params.customerName as string | undefined,
    };
    const review = await deps.reviewsService.submitPublic(slug, dto);
    return success(`Thanks — your ${rating}-star review is submitted.`, {
      review,
      bookingId,
      submitted: true,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Could not submit your review.';
    return failure(message, { bookingId });
  }
}
