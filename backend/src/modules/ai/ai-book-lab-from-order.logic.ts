import type { CommandResult } from './command-completion.types.js';
import type { ClinicLabBookingLogicDeps } from './ai-clinic-lab-booking.logic.js';
import {
  assertClinicLabBookingBusinessType,
  resolveSessionCustomerId,
} from './ai-clinic-lab-booking.util.js';
import {
  buildBookLabFromOrderNavigate,
  formatBookLabFromOrderSummary,
  parseBookLabFromOrderFromPrompt,
} from './ai-book-lab-from-order.util.js';

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

export async function handleBookLabFromOrderLogic(
  deps: ClinicLabBookingLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt = '',
): Promise<CommandResult> {
  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('book_lab_from_order', 'Business not found.');
  }

  const nonClinicType = assertClinicLabBookingBusinessType(business);
  if (nonClinicType !== null) {
    return failure(
      'book_lab_from_order',
      'Lab order booking is only available for clinic businesses.',
      { clinicOnly: true, businessType: nonClinicType },
    );
  }

  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure(
      'book_lab_from_order',
      'Sign in to book collection for your lab order on the Lab to book tab.',
      { clarify: true, missing: ['customerId'] },
    );
  }

  const parsed = parseBookLabFromOrderFromPrompt(effectivePrompt, params);
  if (!parsed) {
    return failure(
      'book_lab_from_order',
      'Tell me which lab order to book (e.g. "Book collection for my lab order" or "Schedule draw from Lab to book tab").',
      { clarify: true },
    );
  }

  let requests =
    await deps.clinicTestOrderBookingRequestService.listPendingBookingRequestsForCustomer(
      businessId,
      customerId,
    );

  if (parsed.orderId) {
    requests = requests.filter(
      (request) =>
        request.orderId === parsed.orderId ||
        request.orderId.startsWith(parsed.orderId!),
    );
  }
  if (parsed.testName) {
    const needle = parsed.testName.toLowerCase();
    requests = requests.filter((request) =>
      (request.displayNames ?? '').toLowerCase().includes(needle),
    );
  }

  const primary = requests[0] ?? null;
  const navigate = buildBookLabFromOrderNavigate({
    orderId: primary?.orderId ?? parsed.orderId ?? null,
  });

  return success(
    'book_lab_from_order',
    formatBookLabFromOrderSummary({
      displayNames: primary?.displayNames ?? null,
      collectionServiceName: primary?.collectionServiceName ?? 'lab collection',
      orderCount: requests.length,
    }),
    {
      customerId,
      count: requests.length,
      requests,
      orderId: primary?.orderId ?? parsed.orderId ?? null,
      testName: parsed.testName ?? null,
      bookUrl: primary?.bookUrl ?? null,
      labToBookTab: true,
      navigate,
      ...(primary?.bookUrl ? { clientAction: 'openLabToBookOrder' } : {}),
    },
  );
}
