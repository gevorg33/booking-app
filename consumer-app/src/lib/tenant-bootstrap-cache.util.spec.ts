import { describe, expect, it } from 'vitest';
import {
  resolveTenantBootstrapErrorMessage,
  resolveTenantBootstrapFetchFailure,
} from './tenant-bootstrap-cache.util.js';

function axiosLikeError(input: {
  status?: number;
  message?: string;
  errorMessage?: string;
}): Error {
  const err = new Error(
    input.errorMessage ??
      (input.status
        ? `Request failed with status code ${input.status}`
        : 'Request failed'),
  ) as Error & { response?: { status?: number; data?: { message?: string } } };
  if (input.status != null || input.message != null) {
    err.response = {
      status: input.status,
      data: input.message != null ? { message: input.message } : undefined,
    };
  }
  return err;
}

describe('tenant-bootstrap-cache.util', () => {
  it.each([
    {
      id: 'e2e-bug.23-store-ready-failed-refresh',
      storeReady: true,
      hasCachedEnabledProfile: true,
      expected: {
        keepShowingProfile: true,
        fromCache: true,
        hydrateFromCache: false,
      },
    },
    {
      id: 'e2e-bug.23-store-ready-no-local-snapshot',
      storeReady: true,
      hasCachedEnabledProfile: false,
      expected: {
        keepShowingProfile: true,
        fromCache: true,
        hydrateFromCache: false,
      },
    },
    {
      id: 'e2e-bug.23-first-visit-cache-only',
      storeReady: false,
      hasCachedEnabledProfile: true,
      expected: {
        keepShowingProfile: true,
        fromCache: true,
        hydrateFromCache: true,
      },
    },
    {
      id: 'e2e-bug.23-no-usable-profile',
      storeReady: false,
      hasCachedEnabledProfile: false,
      expected: {
        keepShowingProfile: false,
        fromCache: false,
        hydrateFromCache: false,
      },
    },
  ])('$id', ({ storeReady, hasCachedEnabledProfile, expected }) => {
    expect(
      resolveTenantBootstrapFetchFailure({ storeReady, hasCachedEnabledProfile }),
    ).toEqual(expected);
  });

  it.each([
    {
      id: 'e2e-bug.20-raw-axios-404',
      error: axiosLikeError({
        status: 404,
        errorMessage: 'Request failed with status code 404',
      }),
      expected: 'Salon not found',
    },
    {
      id: 'e2e-bug.20-nest-business-not-found',
      error: axiosLikeError({ status: 404, message: 'Business not found' }),
      expected: 'Salon not found',
    },
    {
      id: 'e2e-bug.20-other-error-uses-api-message',
      error: axiosLikeError({ status: 500, message: 'Database offline' }),
      expected: 'Database offline',
    },
  ])('$id', ({ error, expected }) => {
    expect(
      resolveTenantBootstrapErrorMessage(error, { salonNotFound: 'Salon not found' }),
    ).toBe(expected);
  });
});
