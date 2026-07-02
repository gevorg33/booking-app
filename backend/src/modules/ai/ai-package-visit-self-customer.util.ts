import {
  CANCEL_PACKAGE_VISIT_SELF_PROMPTS,
  CUSTOMER_CANCEL_PACKAGE_VISIT_SELF_CLASSIFIER_RULES,
} from './ai-cancel-package-visit-self.fixtures.js';
import {
  enrichCancelPackageVisitSelfParamsFromPrompt,
  isCancelPackageVisitSelfPrompt,
  rescueCancelPackageVisitSelfIntent,
} from './ai-cancel-package-visit-self.util.js';
import {
  CUSTOMER_RESCHEDULE_PACKAGE_VISIT_SELF_CLASSIFIER_RULES,
  RESCHEDULE_PACKAGE_VISIT_SELF_PROMPTS,
} from './ai-reschedule-package-visit-self.fixtures.js';
import {
  enrichReschedulePackageVisitSelfParamsFromPrompt,
  isReschedulePackageVisitSelfPrompt,
  rescueReschedulePackageVisitSelfIntent,
} from './ai-reschedule-package-visit-self.util.js';
import { rescueSelfServiceBookingIntent } from './ai-self-service-booking.util.js';

export {
  CANCEL_PACKAGE_VISIT_SELF_PROMPTS,
  CUSTOMER_CANCEL_PACKAGE_VISIT_SELF_CLASSIFIER_RULES,
} from './ai-cancel-package-visit-self.fixtures.js';

export {
  RESCHEDULE_PACKAGE_VISIT_SELF_PROMPTS,
  CUSTOMER_RESCHEDULE_PACKAGE_VISIT_SELF_CLASSIFIER_RULES,
} from './ai-reschedule-package-visit-self.fixtures.js';

export const CUSTOMER_PACKAGE_VISIT_SELF_CLASSIFIER_RULES = `${CUSTOMER_CANCEL_PACKAGE_VISIT_SELF_CLASSIFIER_RULES}
${CUSTOMER_RESCHEDULE_PACKAGE_VISIT_SELF_CLASSIFIER_RULES}`;

export type PackageVisitSelfCustomerPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'cancel_package_visit_self' | 'reschedule_package_visit_self';
  rescueReason: string;
  packageName?: string;
  date?: string;
  timeSlot?: string;
  visitIndex?: number;
};

export const PACKAGE_VISIT_SELF_CUSTOMER_PROMPTS: readonly PackageVisitSelfCustomerPromptFixture[] =
  [
    ...CANCEL_PACKAGE_VISIT_SELF_PROMPTS,
    ...RESCHEDULE_PACKAGE_VISIT_SELF_PROMPTS,
  ];

const PACKAGE_VISIT_SELF_ACTIONS = new Set<
  PackageVisitSelfCustomerPromptFixture['expectedAction']
>(['cancel_package_visit_self', 'reschedule_package_visit_self']);

export { extractPackageVisitIndexFromPrompt } from './ai-cancel-package-visit-self.util.js';

export function enrichPackageVisitSelfParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
  action: PackageVisitSelfCustomerPromptFixture['expectedAction'],
  timeZone = 'UTC',
): Record<string, unknown> {
  if (action === 'cancel_package_visit_self') {
    return enrichCancelPackageVisitSelfParamsFromPrompt(params, prompt);
  }
  return enrichReschedulePackageVisitSelfParamsFromPrompt(
    params,
    prompt,
    timeZone,
  );
}

export function rescuePackageVisitSelfCustomerIntent(
  prompt: string,
  action: string,
): {
  action: PackageVisitSelfCustomerPromptFixture['expectedAction'];
  rescueReason: string;
} | null {
  const cancelRescued = rescueCancelPackageVisitSelfIntent(prompt, action);
  if (cancelRescued) return cancelRescued;

  const rescheduleRescued = rescueReschedulePackageVisitSelfIntent(
    prompt,
    action,
  );
  if (rescheduleRescued) return rescheduleRescued;

  const rescued = rescueSelfServiceBookingIntent(prompt, action);
  if (
    rescued &&
    PACKAGE_VISIT_SELF_ACTIONS.has(
      rescued.action as PackageVisitSelfCustomerPromptFixture['expectedAction'],
    )
  ) {
    return {
      action:
        rescued.action as PackageVisitSelfCustomerPromptFixture['expectedAction'],
      rescueReason: rescued.rescueReason,
    };
  }
  return null;
}

export function detectPackageVisitSelfCustomerAction(
  prompt: string,
): PackageVisitSelfCustomerPromptFixture['expectedAction'] | null {
  if (isCancelPackageVisitSelfPrompt(prompt)) {
    return 'cancel_package_visit_self';
  }
  if (isReschedulePackageVisitSelfPrompt(prompt)) {
    return 'reschedule_package_visit_self';
  }
  return null;
}

export function detectCancelPackageVisitSelfCustomerAction(
  prompt: string,
): 'cancel_package_visit_self' | null {
  return isCancelPackageVisitSelfPrompt(prompt)
    ? 'cancel_package_visit_self'
    : null;
}

export function detectReschedulePackageVisitSelfCustomerAction(
  prompt: string,
): 'reschedule_package_visit_self' | null {
  return isReschedulePackageVisitSelfPrompt(prompt)
    ? 'reschedule_package_visit_self'
    : null;
}
