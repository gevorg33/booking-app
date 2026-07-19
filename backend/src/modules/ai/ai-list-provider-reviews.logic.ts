import type { Employee } from '../employee/entities/employee.entity.js';
import type { Service } from '../service/entities/service.entity.js';
import type { ReviewsService } from '../reviews/reviews.service.js';
import type { Repository } from 'typeorm';
import type { Business } from '../business/entities/business.entity.js';
import type { CommandResult } from './command-completion.types.js';
import { resolveEmployeeByName } from './ai-explain-provider-specialty.util.js';
import { resolveBusinessSlugFromParamsOrId } from './ai-resolve-business-slug.util.js';

export type ListProviderReviewsLogicDeps = {
  employeeRepo: Repository<Employee>;
  serviceRepo: Repository<Service>;
  reviewsService: Pick<ReviewsService, 'listPublicProviderReviews'>;
  businessRepo: Pick<Repository<Business>, 'findOne'>;
};

function failure(summary: string, details: Record<string, unknown> = {}) {
  return { success: false, action: 'list_provider_reviews', summary, details };
}

export async function handleListProviderReviewsLogic(
  deps: ListProviderReviewsLogicDeps,
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

  const providerName =
    (params.providerName as string | undefined) ??
    (params.employeeName as string | undefined) ??
    null;
  let employeeId = params.employeeId as string | undefined;

  if (!employeeId) {
    if (!providerName) {
      return failure('Which provider would you like reviews for?', {
        clarify: true,
        missing: ['providerName'],
      });
    }
    const employees = await deps.employeeRepo.find({
      where: { businessId, isActive: true },
      order: { name: 'ASC' },
    });
    const employee = resolveEmployeeByName(employees, providerName);
    if (!employee) {
      return failure(`I couldn't find a provider named ${providerName}.`, {
        providerName,
        availableProviders: employees.map((entry) => entry.name),
      });
    }
    employeeId = employee.id;
  }

  const page =
    typeof params.page === 'number' && params.page > 0 ? params.page : 1;

  try {
    const reviews = await deps.reviewsService.listPublicProviderReviews(
      slug,
      employeeId,
      page,
    );
    const summary =
      reviews.reviewCount > 0
        ? `${reviews.employeeName} has ${reviews.reviewCount} review(s)${
            reviews.averageRating != null
              ? `, averaging ${reviews.averageRating}/5`
              : ''
          }.`
        : `${reviews.employeeName} has no reviews yet.`;
    return {
      success: true,
      action: 'list_provider_reviews',
      summary,
      details: {
        employeeId: reviews.employeeId,
        employeeName: reviews.employeeName,
        reviews,
        navigate: {
          path: 'professionals',
          query: { employeeId: reviews.employeeId },
        },
      },
    };
  } catch (err: any) {
    return failure(err?.message ?? 'Could not load reviews for this provider.', {
      employeeId,
      reason: 'not_found',
    });
  }
}
