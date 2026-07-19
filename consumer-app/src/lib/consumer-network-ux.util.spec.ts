import { describe, expect, it } from 'vitest';
import {
  extractApiErrorMessage,
  formatFriendlyNetworkError,
  formatPackageScheduleError,
  getHttpErrorStatus,
  isRetryableNetworkError,
  isVisitDurationCapError,
} from './consumer-network-ux.util.js';

function axiosLikeError(input: {
  status?: number;
  message?: string | string[];
  errorMessage?: string;
}): Error {
  const err = new Error(
    input.errorMessage ??
      (input.status
        ? `Request failed with status code ${input.status}`
        : 'Request failed'),
  ) as Error & { response?: { status?: number; data?: { message?: unknown } } };
  if (input.status != null || input.message != null) {
    err.response = {
      status: input.status,
      data: input.message != null ? { message: input.message } : undefined,
    };
  }
  return err;
}

describe('consumer-network-ux.util (adopt-5.4 / e2e-bug.3)', () => {
  it('detects retryable network failures', () => {
    expect(isRetryableNetworkError({ code: 'ERR_NETWORK' })).toBe(true);
    expect(isRetryableNetworkError(new Error('Network Error'))).toBe(true);
    expect(isRetryableNetworkError({ response: { status: 500 } })).toBe(false);
  });

  it.each([
    {
      id: 'e2e-bug.3-suggest-block',
      error: axiosLikeError({
        status: 400,
        message: 'No available block found for the selected services',
      }),
      fallback: 'Could not find a block',
      expected: 'No available block found for the selected services',
    },
    {
      id: 'e2e-bug.33-no-shared-provider',
      error: axiosLikeError({
        status: 400,
        message: 'No provider can perform all selected services',
      }),
      fallback: 'Could not load available times',
      expected: 'No provider can perform all selected services',
    },
    {
      id: 'e2e-bug.33-status-only-suppressed',
      error: axiosLikeError({
        status: 400,
        errorMessage: 'Request failed with status code 400',
      }),
      fallback: 'Could not load available times',
      expected: 'Could not load available times',
    },
    {
      id: 'e2e-bug.3-gift-claim-404',
      error: axiosLikeError({
        status: 404,
        message: 'Gift card code is invalid or already used',
      }),
      fallback: 'Load failed',
      expected: 'Gift card code is invalid or already used',
    },
    {
      id: 'e2e-bug.3-review-400',
      error: axiosLikeError({
        status: 400,
        message:
          'Reviews are available after you complete an appointment with this specialist',
      }),
      fallback: 'Something went wrong',
      expected:
        'Reviews are available after you complete an appointment with this specialist',
    },
    {
      id: 'e2e-bug.3-validation-array',
      error: axiosLikeError({
        status: 400,
        message: ['code must be a string', 'code should not be empty'],
      }),
      fallback: 'Load failed',
      expected: 'code must be a string code should not be empty',
    },
    {
      id: 'e2e-bug.3-status-only-falls-back',
      error: axiosLikeError({ status: 500, errorMessage: 'Request failed with status code 500' }),
      fallback: 'Load failed',
      expected: 'Load failed',
    },
    {
      id: 'e2e-bug.3-plain-error',
      error: new Error('Bad slot'),
      fallback: 'Load failed',
      expected: 'Bad slot',
    },
    {
      id: 'e2e-bug.3-network',
      error: { code: 'ERR_NETWORK' },
      fallback: 'Load failed',
      expected: 'Load failed',
    },
  ])('$id: formatFriendlyNetworkError', ({ error, fallback, expected }) => {
    expect(formatFriendlyNetworkError(error, fallback)).toBe(expected);
  });

  it('extracts status and API message helpers', () => {
    const err = axiosLikeError({ status: 403, message: 'Forbidden' });
    expect(getHttpErrorStatus(err)).toBe(403);
    expect(extractApiErrorMessage(err)).toBe('Forbidden');
    expect(extractApiErrorMessage(new Error('nope'))).toBeNull();
  });

  describe('e2e-bug.15 package schedule errors', () => {
    const cannotSchedule =
      "This package can't be scheduled — it's longer than this business allows for a single visit.";
    const fallback = 'No available same-day visit found for this package';

    it.each([
      {
        id: 'e2e-bug.15-duration-cap-api-message',
        error: axiosLikeError({
          status: 400,
          message: 'Total visit duration (365 min) exceeds the 180 minute limit',
        }),
        expected: cannotSchedule,
        isCap: true,
      },
      {
        id: 'e2e-bug.15-axios-status-only-falls-back',
        error: axiosLikeError({
          status: 400,
          errorMessage: 'Request failed with status code 400',
        }),
        expected: fallback,
        isCap: false,
      },
      {
        id: 'e2e-bug.15-no-block-api-message',
        error: axiosLikeError({
          status: 404,
          message: 'No available block found for the selected services',
        }),
        expected: 'No available block found for the selected services',
        isCap: false,
      },
    ])('$id', ({ error, expected, isCap }) => {
      expect(isVisitDurationCapError(error)).toBe(isCap);
      expect(
        formatPackageScheduleError(error, {
          packageCannotSchedule: cannotSchedule,
          fallback,
        }),
      ).toBe(expected);
    });
  });
});
