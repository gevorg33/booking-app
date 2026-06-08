import type { Repository } from 'typeorm';
import type { Business } from '../business/entities/business.entity.js';
import type { Employee } from '../employee/entities/employee.entity.js';
import type { ReviewsService } from '../reviews/reviews.service.js';
import type { CommandResult } from './command-completion.types.js';

export interface ReviewsLogicDeps {
  businessRepo: Repository<Business>;
  employeeRepo: Repository<Employee>;
  reviewsService: Pick<ReviewsService, 'list' | 'summary' | 'submitPublic'>;
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

function parseRating(value: unknown): number | null {
  const rating = Number(value);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) return null;
  return Math.round(rating);
}

async function resolveEmployeeId(
  deps: ReviewsLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
): Promise<string | undefined> {
  if (typeof params.employeeId === 'string' && params.employeeId.trim()) {
    return params.employeeId.trim();
  }
  const name = String(params.employeeName ?? '').trim();
  if (!name) return undefined;
  const matches = await deps.employeeRepo
    .createQueryBuilder('employee')
    .where('employee.business_id = :businessId', { businessId })
    .andWhere('employee.is_active = true')
    .andWhere('LOWER(employee.name) LIKE :name', {
      name: `%${name.toLowerCase()}%`,
    })
    .getMany();
  return matches.length === 1 ? matches[0]!.id : undefined;
}

export async function handleListReviewsLogic(
  deps: ReviewsLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({ where: { id: businessId } });
  if (!business) return failure('list_reviews', 'Business not found.');

  const employeeId = await resolveEmployeeId(deps, businessId, params);
  const [reviews, summaryRows] = await Promise.all([
    deps.reviewsService.list(businessId, employeeId),
    deps.reviewsService.summary(businessId),
  ]);

  const reviewCount = summaryRows.reduce((sum, row) => sum + row.reviewCount, 0);
  const weighted =
    reviewCount === 0
      ? null
      : summaryRows.reduce(
          (sum, row) => sum + row.avgRating * row.reviewCount,
          0,
        ) / reviewCount;

  const recent = reviews.slice(0, 10).map((review) => ({
    id: review.id,
    rating: review.rating,
    comment: review.comment?.trim() || null,
    employeeName: review.employee?.name ?? null,
    customerName: review.customerName ?? review.customer?.name ?? null,
    createdAt: review.createdAt.toISOString(),
  }));

  const avg = weighted != null ? weighted.toFixed(1) : 'no ratings yet';

  return success(
    'list_reviews',
    employeeId
      ? `Showing ${recent.length} recent review(s) for the selected provider (avg ${avg}).`
      : `Reviews inbox: ${reviewCount} total, average ${avg}. Showing ${recent.length} most recent.`,
    {
      reviewCount,
      averageRating: weighted,
      recentReviews: recent,
      employeeId,
      byEmployee: summaryRows,
    },
  );
}

export async function handleSubmitReviewLogic(
  deps: ReviewsLogicDeps,
  businessId: string,
  slug: string | undefined,
  params: Record<string, unknown> = {},
): Promise<CommandResult> {
  const bookingId = String(params.bookingId ?? '').trim();
  const token = String(params.token ?? '').trim();
  const rating = parseRating(params.rating);
  const comment =
    typeof params.comment === 'string' ? params.comment.trim() : undefined;

  if (!bookingId || !token) {
    return failure(
      'submit_review',
      'Open your review link from the appointment email or manage page, then say e.g. "Leave a 5 star review" with the link context.',
      { clarify: true, missing: ['bookingId', 'token'] },
    );
  }
  if (rating == null) {
    return failure(
      'submit_review',
      'What rating should I submit (1–5 stars)?',
      { clarify: true, missing: ['rating'] },
    );
  }
  if (!slug) {
    return failure('submit_review', 'Business slug is required to submit a review.');
  }

  const review = await deps.reviewsService.submitPublic(slug, {
    bookingId,
    token,
    rating,
    comment,
    customerName:
      typeof params.customerName === 'string'
        ? params.customerName.trim()
        : undefined,
  });

  return success('submit_review', `Review submitted (${rating}/5). Thank you!`, {
    reviewId: review.id,
    rating: review.rating,
  });
}
