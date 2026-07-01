import {
  CUSTOMER_LIST_MY_PACKAGE_VISITS_CLASSIFIER_RULES,
  LIST_MY_PACKAGE_VISITS_CUSTOMER_PROMPTS,
  detectListMyPackageVisitsCustomerAction,
  enrichListMyPackageVisitsParamsFromPrompt,
  groupCustomerPackageVisits,
  rescueListMyPackageVisitsCustomerIntent,
} from './ai-list-my-package-visits-customer.util.js';
import {
  isListMyAppointmentsPrompt,
  isListMyPackageVisitsCustomerPrompt,
  rescueSelfServiceBookingIntent,
} from './ai-self-service-booking.util.js';
import { isListMyPackageVisitsPrompt } from './ai-provider-booking.util.js';
import { isCancelPackageVisitSelfPrompt } from './ai-self-service-booking.util.js';
import { AI_COMMAND_EVAL_LIST_MY_PACKAGE_VISITS_CUSTOMER_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';

describe('ai-list-my-package-visits-customer.util (ai-cmd-customer-4.0 P2)', () => {
  it('exports classifier rules for package visit list', () => {
    expect(CUSTOMER_LIST_MY_PACKAGE_VISITS_CLASSIFIER_RULES).toContain(
      'list_my_package_visits',
    );
  });

  it.each(
    LIST_MY_PACKAGE_VISITS_CUSTOMER_PROMPTS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects list package visits prompt $id', (_id, row) => {
    expect(isListMyPackageVisitsCustomerPrompt(row.prompt)).toBe(true);
    expect(detectListMyPackageVisitsCustomerAction(row.prompt)).toBe(
      row.expectedAction,
    );
  });

  it.each(
    LIST_MY_PACKAGE_VISITS_CUSTOMER_PROMPTS.map(
      (row) => [row.id, row] as const,
    ),
  )('rescues list package visits prompt $id from unknown', (_id, row) => {
    const rescued = rescueListMyPackageVisitsCustomerIntent(
      row.prompt,
      'unknown',
    );
    expect(rescued?.action).toBe(row.expectedAction);
    expect(rescued?.rescueReason).toBe(row.rescueReason);
    expect(rescueSelfServiceBookingIntent(row.prompt, 'unknown')?.action).toBe(
      row.expectedAction,
    );
  });

  it('groups package visits and enriches packageName from prompt', () => {
    const grouped = groupCustomerPackageVisits([
      {
        id: 'b1',
        packagePurchaseId: 'purchase-1',
        packageId: 'pkg-1',
        packageName: 'Spa Day',
        serviceName: 'Massage',
        employeeName: 'Anna',
        startTime: '2026-07-01T10:00:00.000Z',
        status: 'confirmed',
      },
      {
        id: 'b2',
        packagePurchaseId: 'purchase-1',
        packageId: 'pkg-1',
        packageName: 'Spa Day',
        serviceName: 'Facial',
        employeeName: 'Anna',
        startTime: '2026-07-01T11:00:00.000Z',
        status: 'completed',
      },
    ]);
    expect(grouped).toHaveLength(1);
    expect(grouped[0]).toMatchObject({
      packagePurchaseId: 'purchase-1',
      visitsTotal: 2,
      visitsRemaining: 1,
      visitsCompleted: 1,
    });
    expect(
      enrichListMyPackageVisitsParamsFromPrompt(
        {},
        'Show my spa day package visits',
      ).packageName,
    ).toBe('Spa Day');
  });

  it('does not steal appointments list, package cancel, or provider calendar prompts', () => {
    expect(isListMyAppointmentsPrompt('List my appointments')).toBe(true);
    expect(isListMyPackageVisitsCustomerPrompt('List my appointments')).toBe(
      false,
    );

    expect(isCancelPackageVisitSelfPrompt('Cancel my package visit')).toBe(
      true,
    );
    expect(
      detectListMyPackageVisitsCustomerAction('Cancel my package visit'),
    ).toBeNull();

    expect(
      isListMyPackageVisitsPrompt('List my package visits this week'),
    ).toBe(true);
    expect(
      rescueListMyPackageVisitsCustomerIntent(
        'List package visits this week',
        'unknown',
      ),
    ).toBeNull();
  });

  it('maps list package visits fixtures to passing eval golden cases', () => {
    const failures = LIST_MY_PACKAGE_VISITS_CUSTOMER_PROMPTS.filter(
      (row) => !isListMyPackageVisitsCustomerPrompt(row.prompt),
    ).map((row) => row.id);
    expect(failures).toEqual([]);

    expect(
      LIST_MY_PACKAGE_VISITS_CUSTOMER_PROMPTS.length,
    ).toBeGreaterThanOrEqual(10);
    expect(AI_COMMAND_EVAL_LIST_MY_PACKAGE_VISITS_CUSTOMER_CASES.length).toBe(
      LIST_MY_PACKAGE_VISITS_CUSTOMER_PROMPTS.length,
    );
    for (const evalCase of AI_COMMAND_EVAL_LIST_MY_PACKAGE_VISITS_CUSTOMER_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).errors).toEqual([]);
    }
  });
});
