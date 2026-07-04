import type { Employee } from '../employee/entities/employee.entity.js';
import type { Repository } from 'typeorm';
import type { ReviewsService } from '../reviews/reviews.service.js';
import type { CommandResult } from './command-completion.types.js';
import { resolveEmployeeByName } from './ai-explain-provider-specialty.util.js';

export interface SubmitProviderReviewLogicDeps {
  employeeRepo: Repository<Employee>;
  reviewsService: Pick<ReviewsService, 'submitProviderPortalReview'>;
}

function failure(
  summary: string,
  details: Record<string, unknown> = {},
): CommandResult {
  return { success: false, action: 'submit_provider_review', summary, details };
}

function success(
  summary: string,
  details: Record<string, unknown> = {},
): CommandResult {
  return { success: true, action: 'submit_provider_review', summary, details };
}

function resolveSessionCustomerId(
  params: Record<string, unknown>,
): string | undefined {
  const raw = params.sessionCustomerId ?? params.customerId;
  return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined;
}

export async function handleSubmitProviderReviewLogic(
  deps: SubmitProviderReviewLogicDeps,
  businessId: string,
  params: Record<string, any> = {},
): Promise<CommandResult> {
  const slug = params.slug as string | undefined;
  if (!slug) return failure('Business not found.');

  const providerName =
    (params.providerName as string | undefined) ??
    (params.employeeName as string | undefined) ??
    null;
  let employeeId = params.employeeId as string | undefined;
  let employeeName: string | undefined;

  if (!employeeId) {
    if (!providerName) {
      return failure('Which provider would you like to review?', {
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
    employeeName = employee.name;
  }

  const rating =
    typeof params.rating === 'number' ? params.rating : Number(params.rating);
  if (!rating || Number.isNaN(rating) || rating < 1 || rating > 5) {
    return failure('Give a star rating from 1 to 5 for this provider.', {
      clarify: true,
      missing: ['rating'],
      employeeId,
    });
  }

  const customerId = resolveSessionCustomerId(params);
  const idToken = params.idToken as string | undefined;

  try {
    const review = await deps.reviewsService.submitProviderPortalReview(
      slug,
      employeeId,
      {
        rating,
        comment: params.comment as string | undefined,
        idToken,
      },
      customerId,
    );
    return success(
      `Thanks — your ${rating}-star review${employeeName ? ` for ${employeeName}` : ''} is submitted.`,
      { review, employeeId },
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Could not submit your review.';
    const needsSignIn = /sign in with google/i.test(message);
    return failure(message, {
      employeeId,
      ...(needsSignIn ? { clarify: true, missing: ['idToken'] } : {}),
    });
  }
}
