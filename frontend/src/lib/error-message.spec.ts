import { describe, expect, it } from 'vitest';
import {
  getErrorMessage,
  getPackageScheduleErrorMessage,
  isVisitDurationCapError,
} from './error-message';

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

describe('error-message (e2e-bug.63 / e2e-bug.15)', () => {
  it('prefers Nest response.message over axios status text', () => {
    const err = axiosLikeError({
      status: 400,
      message: 'Gift card code is invalid or already used',
    });
    expect(getErrorMessage(err, 'fallback')).toBe('Gift card code is invalid or already used');
  });

  it('falls back when only axios status text is present', () => {
    const err = axiosLikeError({
      status: 400,
      errorMessage: 'Request failed with status code 400',
    });
    expect(getErrorMessage(err, 'Could not load')).toBe('Could not load');
  });

  it.each([
    {
      id: 'e2e-bug.63-invite-500',
      status: 500,
      fallback: 'Could not send invitation',
    },
    {
      id: 'e2e-bug.63-invitation-404',
      status: 404,
      fallback: 'Invitation not found',
    },
    {
      id: 'e2e-bug.63-reset-link-404',
      status: 404,
      fallback: 'This reset link is invalid or expired',
    },
  ])('$id uses translated fallback instead of axios status text', ({ status, fallback }) => {
    const err = axiosLikeError({
      status,
      errorMessage: `Request failed with status code ${status}`,
    });
    expect(getErrorMessage(err, fallback)).toBe(fallback);
    expect(getErrorMessage(err, fallback)).not.toMatch(/Request failed with status code/i);
  });

  it('still surfaces intentional client Error messages (e2e-bug.63)', () => {
    expect(getErrorMessage(new Error('Please sign in to manage this booking'), 'fallback')).toBe(
      'Please sign in to manage this booking',
    );
  });

  it.each([
    {
      id: 'e2e-bug.15-duration-cap',
      error: axiosLikeError({
        status: 400,
        message: 'Total visit duration (365 min) exceeds the 180 minute limit',
      }),
      expected: "This package can't be scheduled",
      isCap: true,
    },
    {
      id: 'e2e-bug.15-status-only',
      error: axiosLikeError({
        status: 400,
        errorMessage: 'Request failed with status code 400',
      }),
      expected: 'No block',
      isCap: false,
    },
  ])('$id getPackageScheduleErrorMessage', ({ error, expected, isCap }) => {
    expect(isVisitDurationCapError(error)).toBe(isCap);
    expect(
      getPackageScheduleErrorMessage(error, {
        packageCannotSchedule: "This package can't be scheduled",
        fallback: 'No block',
      }),
    ).toBe(expected);
  });
});
