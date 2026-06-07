import type {
  AiCommandEvalCase,
  AiEvalLocale,
} from './eval/ai-command-eval.types.js';
import type { ClinicLabBookingMultilingualEvalScenario } from './ai-clinic-lab-booking-multilingual.fixtures.js';
import {
  isAwaitingPatientBookingListPrompt,
  parseBookLabCollectionFromPrompt,
  parseListMyLabBookingRequestsFromPrompt,
  parsePushLabBookingFromPrompt,
  parseStaffBookLabCollectionFromPrompt,
  rescueConsumerClinicLabBookingIntent,
  rescueDashboardClinicLabBookingIntent,
  rescueProviderClinicLabBookingIntent,
} from './ai-clinic-lab-booking.util.js';

const EN_TO_LOCALIZED_CUSTOMER_NAME: Record<
  string,
  Record<'hy' | 'ru', string>
> = {
  Maria: { hy: 'Մարիա', ru: 'Мария' },
  John: { hy: 'Ջոն', ru: 'Джон' },
  Alex: { hy: 'Ալեքս', ru: 'Алекс' },
  Jane: { hy: 'Ջեյն', ru: 'Джейн' },
  Sofia: { hy: 'Սոֆիա', ru: 'София' },
};

function localizeLabBookingParamsPartial(
  paramsPartial: Record<string, unknown> | undefined,
  locale: AiEvalLocale,
): Record<string, unknown> | undefined {
  if (!paramsPartial) return paramsPartial;
  if (locale === 'en') return paramsPartial;
  const localized = { ...paramsPartial };
  if (typeof localized.customerName === 'string') {
    const mapped = EN_TO_LOCALIZED_CUSTOMER_NAME[localized.customerName];
    if (mapped) {
      localized.customerName = mapped[locale];
    }
  }
  return localized;
}

export interface ClinicLabBookingSurfaceRescueResult {
  action: string;
  rescueReason: string;
  params: Record<string, unknown>;
}

export function rescueClinicLabBookingSurfaceForEval(
  prompt: string,
  misclassifiedAction: string,
  surface: ClinicLabBookingMultilingualEvalScenario['surface'],
): ClinicLabBookingSurfaceRescueResult | null {
  switch (surface) {
    case 'dashboard': {
      if (isAwaitingPatientBookingListPrompt(prompt)) {
        return {
          action: 'list_test_orders',
          rescueReason: 'list_test_orders',
          params: { awaitingPatientBooking: true },
        };
      }
      const rescued = rescueDashboardClinicLabBookingIntent(
        prompt,
        misclassifiedAction,
      );
      if (!rescued) return null;
      const params: Record<string, unknown> = {};
      if (rescued.action === 'push_lab_booking_to_patient') {
        const parsed = parsePushLabBookingFromPrompt(prompt);
        if (parsed?.customerName) params.customerName = parsed.customerName;
        if (parsed?.orderId) params.orderId = parsed.orderId;
      } else {
        const parsed = parseStaffBookLabCollectionFromPrompt(prompt);
        if (parsed?.customerName) params.customerName = parsed.customerName;
        if (parsed?.orderId) params.orderId = parsed.orderId;
      }
      return {
        action: rescued.action,
        rescueReason: rescued.rescueReason,
        params,
      };
    }
    case 'customer': {
      const rescued = rescueConsumerClinicLabBookingIntent(
        prompt,
        misclassifiedAction,
      );
      if (!rescued) return null;
      const params: Record<string, unknown> = {};
      if (rescued.action === 'book_lab_collection') {
        const parsed = parseBookLabCollectionFromPrompt(prompt);
        if (parsed?.orderId) params.orderId = parsed.orderId;
      } else {
        const parsed = parseListMyLabBookingRequestsFromPrompt(prompt);
        if (parsed?.orderId) params.orderId = parsed.orderId;
      }
      return {
        action: rescued.action,
        rescueReason: rescued.rescueReason,
        params,
      };
    }
    case 'provider': {
      const rescued = rescueProviderClinicLabBookingIntent(
        prompt,
        misclassifiedAction,
      );
      if (!rescued) return null;
      return {
        action: rescued.action,
        rescueReason: rescued.rescueReason,
        params: {},
      };
    }
    default:
      return null;
  }
}

export function clinicLabBookingMultilingualScenarioToEvalCase(
  scenario: ClinicLabBookingMultilingualEvalScenario,
): AiCommandEvalCase {
  const paramsPartial = localizeLabBookingParamsPartial(
    scenario.paramsPartial,
    scenario.locale,
  );
  return {
    id: `clinic-lab-booking-${scenario.id}`,
    prompt: scenario.prompt,
    locale: scenario.locale,
    surface: scenario.surface,
    expect: {
      rescuedAction: scenario.expectedAction,
      rescueReason: scenario.rescueReason ?? scenario.expectedAction,
      needsMultilingual: true,
      useSurfaceLabBookingRescue: true,
      ...(scenario.rescueFromAction
        ? { rescueFromAction: scenario.rescueFromAction }
        : {}),
      ...(paramsPartial ? { paramsPartial } : {}),
    },
  };
}
