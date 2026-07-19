import {
  CHECK_WAITLIST_STATUS_PROMPTS,
  CUSTOMER_PUBLIC_CUSTOMER_WAITLIST_CLASSIFIER_RULES,
  CUSTOMER_WAITLIST_RESCUE_SCENARIOS,
  E2E112_PROVIDER_ONLY_WAITLIST_SCENARIOS,
  JOIN_WAITLIST_PROMPTS,
} from './ai-customer-waitlist.fixtures.js';
import { CUSTOMER_WAITLIST_MULTILINGUAL_SCENARIOS } from './ai-customer-waitlist-multilingual.fixtures.js';
import { AI_COMMAND_EVAL_CUSTOMER_WAITLIST_CASES } from './eval/ai-command-eval.cases.js';
import {
  isCheckWaitlistStatusPrompt,
  isJoinWaitlistPrompt,
  isStaffWaitlistPrompt,
  parseCheckWaitlistStatusFromPrompt,
  parseJoinWaitlistFromPrompt,
  rescueCustomerWaitlistIntent,
  rescueJoinWaitlistIntent,
  isJoinWaitlistIntent,
  isCheckWaitlistStatusIntent,
  isCustomerWaitlistIntent,
  detectCustomerWaitlistAction,
  enrichJoinWaitlistParamsFromPrompt,
  looksLikeWaitlistPersonName,
  sanitizeWaitlistPreferenceNames,
} from './ai-customer-waitlist.util.js';
import {
  buildCustomerWaitlistRequest,
  buildJoinWaitlistSuccessSummary,
  formatCustomerWaitlistPreferenceSummary,
} from '../../common/utils/customer-waitlist.util.js';

describe('ai-customer-waitlist.util (ai-cmd-customer-4.4.7)', () => {
  it('exports classifier rules', () => {
    expect(CUSTOMER_PUBLIC_CUSTOMER_WAITLIST_CLASSIFIER_RULES).toContain(
      'join_waitlist',
    );
    expect(CUSTOMER_PUBLIC_CUSTOMER_WAITLIST_CLASSIFIER_RULES).toContain(
      'check_waitlist_status',
    );
  });

  it.each(JOIN_WAITLIST_PROMPTS.map((row) => [row.id, row] as const))(
    'detects join waitlist prompt %s',
    (_id, row) => {
      expect(isJoinWaitlistPrompt(row.prompt)).toBe(true);
      expect(parseJoinWaitlistFromPrompt(row.prompt)).not.toBeNull();
      expect(
        rescueJoinWaitlistIntent(row.prompt, 'check_availability')?.action,
      ).toBe('join_waitlist');
    },
  );

  it.each(CHECK_WAITLIST_STATUS_PROMPTS.map((row) => [row.id, row] as const))(
    'detects check waitlist status prompt %s',
    (_id, row) => {
      expect(isCheckWaitlistStatusPrompt(row.prompt)).toBe(true);
      expect(parseCheckWaitlistStatusFromPrompt(row.prompt)).not.toBeNull();
      expect(
        rescueCustomerWaitlistIntent(row.prompt, 'list_waitlist_entries')
          ?.action,
      ).toBe('check_waitlist_status');
    },
  );

  it.each(
    CUSTOMER_WAITLIST_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects multilingual waitlist prompt %s', (_id, row) => {
    if (row.expectedAction === 'join_waitlist') {
      expect(isJoinWaitlistPrompt(row.prompt)).toBe(true);
    } else {
      expect(isCheckWaitlistStatusPrompt(row.prompt)).toBe(true);
    }
  });

  it.each(
    CUSTOMER_WAITLIST_RESCUE_SCENARIOS.map((row) => [row.id, row] as const),
  )('rescues misclassified waitlist prompt %s', (_id, row) => {
    expect(
      rescueCustomerWaitlistIntent(row.prompt, row.misclassifiedAction)?.action,
    ).toBe(row.expectedAction);
  });

  it('rejects staff waitlist prompts', () => {
    expect(isStaffWaitlistPrompt('List waitlist entries for Friday')).toBe(
      true,
    );
    expect(isJoinWaitlistPrompt('List waitlist entries for Friday')).toBe(
      false,
    );
    expect(isCheckWaitlistStatusPrompt('Offer waitlist slot to Anna')).toBe(
      false,
    );
  });

  it('exposes intent helpers', () => {
    expect(isJoinWaitlistIntent('join_waitlist')).toBe(true);
    expect(isCheckWaitlistStatusIntent('check_waitlist_status')).toBe(true);
    expect(isCustomerWaitlistIntent('join_waitlist')).toBe(true);
    expect(detectCustomerWaitlistAction('Am I on the waitlist?')).toBe(
      'check_waitlist_status',
    );
    expect(
      enrichJoinWaitlistParamsFromPrompt({}, 'Join waitlist for massage')
        .serviceName,
    ).toBe('massage');
  });

  it('detects heuristic join and status phrasing', () => {
    expect(isJoinWaitlistPrompt('Notify if something opens Tuesday')).toBe(
      true,
    );
    expect(
      parseJoinWaitlistFromPrompt(
        'Sign me up for the waiting list for manicure',
      )?.serviceName,
    ).toBe('manicure');
    expect(isCheckWaitlistStatusPrompt('Սպասման ցուցակում եմ՞')).toBe(true);
    expect(isJoinWaitlistPrompt('Offer waitlist slot to Anna')).toBe(false);
    expect(
      rescueJoinWaitlistIntent('Join waitlist', 'join_waitlist'),
    ).toBeNull();
  });

  it('maps fixtures to eval cases', () => {
    expect(AI_COMMAND_EVAL_CUSTOMER_WAITLIST_CASES.length).toBe(
      JOIN_WAITLIST_PROMPTS.length +
        CHECK_WAITLIST_STATUS_PROMPTS.length +
        CUSTOMER_WAITLIST_MULTILINGUAL_SCENARIOS.length +
        CUSTOMER_WAITLIST_RESCUE_SCENARIOS.length,
    );
  });

  it.each(E2E112_PROVIDER_ONLY_WAITLIST_SCENARIOS)(
    'e2e-bug.112 does not duplicate provider into serviceName ($id)',
    ({ prompt, serviceName, employeeName }) => {
      const parsed = parseJoinWaitlistFromPrompt(prompt);
      expect(parsed).not.toBeNull();
      expect(parsed?.employeeName).toBe(employeeName);
      if (serviceName) {
        expect(parsed?.serviceName).toBe(serviceName);
      } else {
        expect(parsed?.serviceName).toBeUndefined();
      }
      expect(parsed?.serviceName).not.toBe(parsed?.employeeName);

      // Classifier sometimes pre-fills both slots with the provider name.
      const fromClassifier = enrichJoinWaitlistParamsFromPrompt(
        { serviceName: employeeName, employeeName },
        prompt,
      );
      expect(fromClassifier.serviceName).toBeUndefined();
      expect(fromClassifier.employeeName).toBe(employeeName);

      const summary = buildJoinWaitlistSuccessSummary(
        buildCustomerWaitlistRequest({
          ...(typeof fromClassifier.serviceName === 'string'
            ? { serviceName: fromClassifier.serviceName }
            : {}),
          employeeName: String(fromClassifier.employeeName),
          date: '18/07/2026',
        }),
      );
      expect(summary).not.toContain(`${employeeName} with ${employeeName}`);
      expect(summary).toContain(`with ${employeeName}`);
    },
  );

  it('e2e-bug.112 sanitize + person-name helpers', () => {
    expect(looksLikeWaitlistPersonName('Gevorg Gasparyan')).toBe(true);
    expect(looksLikeWaitlistPersonName('massage')).toBe(false);
    expect(looksLikeWaitlistPersonName('Swedish massage')).toBe(false);
    expect(
      sanitizeWaitlistPreferenceNames({
        serviceName: 'Gevorg Gasparyan',
        employeeName: 'Gevorg Gasparyan',
      }),
    ).toEqual({ employeeName: 'Gevorg Gasparyan' });
    expect(
      formatCustomerWaitlistPreferenceSummary(
        buildCustomerWaitlistRequest({
          serviceName: 'Gevorg Gasparyan',
          employeeName: 'Gevorg Gasparyan',
          date: '18/07/2026',
        }),
      ),
    ).toBe('with Gevorg Gasparyan on 18/07/2026');
  });
});
