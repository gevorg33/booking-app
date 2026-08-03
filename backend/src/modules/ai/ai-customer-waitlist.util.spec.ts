import {
  CHECK_WAITLIST_STATUS_PROMPTS,
  CUSTOMER_PUBLIC_CUSTOMER_WAITLIST_CLASSIFIER_RULES,
  CUSTOMER_WAITLIST_RESCUE_SCENARIOS,
  E2E112_PROVIDER_ONLY_WAITLIST_SCENARIOS,
  E2E235_WAITLIST_PROMPT_SCENARIOS,
  E2E235_WAITLIST_SUMMARY_SCENARIOS,
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
      expect(summary).not.toContain(`with ${employeeName} with`);
      expect(summary).toContain(employeeName);
      // e2e-bug.235 — provider-only summaries omit leading "with".
      if (fromClassifier.serviceName) {
        expect(summary).toContain(`with ${employeeName}`);
      } else {
        expect(summary).not.toMatch(
          new RegExp(
            `opens for with ${employeeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
          ),
        );
        expect(summary).toContain(`opens for ${employeeName}`);
      }

      // When the prompt also names a real service, summary keeps service + one "with".
      if (serviceName) {
        const withService = buildJoinWaitlistSuccessSummary(
          buildCustomerWaitlistRequest({
            serviceName,
            employeeName,
            date: '18/07/2026',
          }),
        );
        expect(withService).toContain(`${serviceName} with ${employeeName}`);
        expect(withService).not.toContain(`with ${employeeName} with`);
      }
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
    ).toBe('Gevorg Gasparyan on 18/07/2026');
  });

  it.each(
    E2E235_WAITLIST_SUMMARY_SCENARIOS.filter(
      (s) =>
        !!s.employeeName &&
        !!s.serviceName &&
        s.serviceName.toLowerCase().includes(' with '),
    ),
  )(
    'e2e-bug.235 sanitize strips baked-in provider ($id)',
    ({ serviceName, employeeName, expectedSummary, date, forbidden }) => {
      const sanitized = sanitizeWaitlistPreferenceNames({
        serviceName: serviceName!,
        employeeName: employeeName!,
      });
      expect(sanitized.serviceName?.toLowerCase()).not.toContain(' with ');
      expect(sanitized.employeeName).toBe(employeeName);
      const summary = formatCustomerWaitlistPreferenceSummary(
        buildCustomerWaitlistRequest({
          ...sanitized,
          date,
        }),
      );
      expect(summary).toBe(expectedSummary);
      for (const bad of forbidden) {
        expect(summary).not.toContain(bad);
      }
    },
  );

  it('e2e-bug.235 enrich recovers Swedish + short Gevorg', () => {
    const enriched = enrichJoinWaitlistParamsFromPrompt(
      {
        serviceName: 'Swedish massage with Gevorg',
        employeeName: 'Gevorg',
      },
      'put me on the waitlist for Swedish massage with Gevorg tomorrow',
    );
    expect(enriched.serviceName).toBe('Swedish massage');
    expect(enriched.employeeName).toBe('Gevorg');
    const summary = buildJoinWaitlistSuccessSummary(
      buildCustomerWaitlistRequest({
        serviceName: String(enriched.serviceName),
        employeeName: String(enriched.employeeName),
        date: '29/07/2026',
      }),
    );
    expect(summary).toContain('Swedish massage with Gevorg on 29/07/2026');
    expect(summary).not.toContain('with Gevorg with Gevorg');
  });

  it.each(E2E235_WAITLIST_PROMPT_SCENARIOS)(
    'e2e-bug.235 prompt parse + summary ($id)',
    ({
      prompt,
      serviceName,
      employeeName,
      summaryIncludes,
      forbidden,
    }) => {
      const parsed = parseJoinWaitlistFromPrompt(prompt);
      expect(parsed).not.toBeNull();
      if (serviceName) expect(parsed?.serviceName).toBe(serviceName);
      else expect(parsed?.serviceName).toBeUndefined();
      if (employeeName) expect(parsed?.employeeName).toBe(employeeName);
      const summary = buildJoinWaitlistSuccessSummary(
        buildCustomerWaitlistRequest({
          ...(parsed?.serviceName ? { serviceName: parsed.serviceName } : {}),
          ...(parsed?.employeeName
            ? { employeeName: parsed.employeeName }
            : {}),
          date: '29/07/2026',
        }),
      );
      expect(summary).toContain(summaryIncludes);
      for (const bad of forbidden) {
        expect(summary).not.toContain(bad);
      }
    },
  );
});
