import {
  mergeMultiCheckoutReturnQuery,
  mergePackageCheckoutReturnQuery,
  parseCheckoutReturnRoute,
  resolveCheckoutReturnNavigationPath,
} from './consumer-checkout-return.util.js';
import type { DeferredInstallLink } from './deferred-install-link.util.js';
import { parseDeferredInstallFromUrl } from './deferred-install-link.util.js';
import {
  mergeDeferredInstallLink,
  resolveDeferredInstallNavigationPath,
} from './deferred-install-resume.util.js';
import { appendRebookQueryParams, buildRebookBookServicePath } from './consumer-rebook.util.js';
import {
  buildBookServicePath,
  buildManageBookingPath,
  buildResultsPath,
  buildSalonPath,
  parseAccountRoute,
  parseBookServiceRoute,
  parseLabBookingRequestRoute,
  parseManageBookingRoute,
  parseResultReadyRoute,
  parseTenantSlugFromUrl,
  resolveLabBookingRequestNavigationPath,
} from './deep-link.js';

export interface DeepLinkLaunchTarget {
  path: string;
  deferredLink?: DeferredInstallLink;
}

function bookServiceLaunchPath(
  bookService: NonNullable<ReturnType<typeof parseBookServiceRoute>>,
  deferredLink?: DeferredInstallLink,
): string {
  const isRebook =
    bookService.rebookBookingId != null ||
    bookService.rebookSource === 'widget' ||
    bookService.rebookSource === 'account';

  if (bookService.slot && isRebook && bookService.rebookBookingId) {
    return buildRebookBookServicePath(
      bookService.slug,
      {
        id: bookService.rebookBookingId,
        serviceId: bookService.serviceId,
        startTime: bookService.slot,
        employeeId: bookService.employeeId ?? '',
      },
      {
        source:
          bookService.rebookSource === 'widget' || bookService.rebookSource === 'account'
            ? bookService.rebookSource
            : undefined,
      },
    );
  }

  if (bookService.date && bookService.slot) {
    const link = mergeDeferredInstallLink(
      deferredLink ?? {
        slug: bookService.slug,
        capturedAt: new Date().toISOString(),
      },
      {
        serviceId: bookService.serviceId,
        date: bookService.date,
        slot: bookService.slot,
        employeeId: bookService.employeeId,
      },
    );
    return resolveDeferredInstallNavigationPath(link);
  }

  if (bookService.slot) {
    const base = buildBookServicePath(bookService.slug, bookService.serviceId, {
      employeeId: bookService.employeeId,
    });
    return appendRebookQueryParams(base, {
      date: (bookService.date ?? bookService.slot.slice(0, 10)).slice(0, 10),
      slot: bookService.slot,
      employeeId: bookService.employeeId,
      rebookBookingId: bookService.rebookBookingId,
      rebook: '1',
      rebookSource:
        bookService.rebookSource === 'widget' || bookService.rebookSource === 'account'
          ? bookService.rebookSource
          : undefined,
    });
  }

  return buildBookServicePath(bookService.slug, bookService.serviceId, {
    employeeId: bookService.employeeId,
  });
}

/** Resolve first-open / appUrlOpen navigation with deferred salon+service restore (adopt-2.4 / n99-3.1). */
export function resolveDeepLinkLaunchTarget(
  rawUrl: string,
  storedDeferred?: DeferredInstallLink | null,
): DeepLinkLaunchTarget | null {
  const deferredFromUrl = parseDeferredInstallFromUrl(rawUrl);

  const checkoutReturn = parseCheckoutReturnRoute(rawUrl);
  if (checkoutReturn) {
    let query = checkoutReturn.query;
    if (checkoutReturn.kind === 'package' && checkoutReturn.packageId) {
      query = mergePackageCheckoutReturnQuery(
        checkoutReturn.slug,
        checkoutReturn.packageId,
        checkoutReturn.query,
      );
    } else if (checkoutReturn.kind === 'multi') {
      query = mergeMultiCheckoutReturnQuery(checkoutReturn.slug, checkoutReturn.query);
    }
    return {
      path: resolveCheckoutReturnNavigationPath({ ...checkoutReturn, query }),
      deferredLink: deferredFromUrl ?? undefined,
    };
  }

  const bookService = parseBookServiceRoute(rawUrl);
  if (bookService) {
    const deferredLink = deferredFromUrl
      ? mergeDeferredInstallLink(deferredFromUrl, {
          serviceId: bookService.serviceId,
          date: bookService.date,
          slot: bookService.slot,
          employeeId: bookService.employeeId,
        })
      : undefined;
    return {
      path: bookServiceLaunchPath(bookService, deferredLink),
      deferredLink,
    };
  }

  const account = parseAccountRoute(rawUrl);
  if (account) {
    return {
      path: buildSalonPath(account.slug, '/account'),
      deferredLink: deferredFromUrl ?? undefined,
    };
  }

  const manage = parseManageBookingRoute(rawUrl);
  if (manage) {
    return {
      path: buildManageBookingPath(manage.slug, manage.bookingId, manage.token),
      deferredLink: deferredFromUrl ?? undefined,
    };
  }

  const labBookingRequest = parseLabBookingRequestRoute(rawUrl);
  if (labBookingRequest) {
    return {
      path: resolveLabBookingRequestNavigationPath(labBookingRequest),
      deferredLink: deferredFromUrl ?? undefined,
    };
  }

  const resultReady = parseResultReadyRoute(rawUrl);
  if (resultReady) {
    return {
      path: buildResultsPath(resultReady.slug),
      deferredLink: deferredFromUrl ?? undefined,
    };
  }

  const slug = parseTenantSlugFromUrl(rawUrl);
  if (slug) {
    const link = deferredFromUrl ?? undefined;
    return {
      path: link ? resolveDeferredInstallNavigationPath(link) : buildSalonPath(slug),
      deferredLink: link,
    };
  }

  if (storedDeferred) {
    return {
      path: resolveDeferredInstallNavigationPath(storedDeferred),
      deferredLink: storedDeferred,
    };
  }

  return null;
}
