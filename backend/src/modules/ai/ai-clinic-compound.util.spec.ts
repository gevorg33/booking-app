import {
  CLINIC_COMPOUND_RESCUE_SCENARIOS,
  CLINIC_COMPOUND_SCENARIOS,
  CUSTOMER_CLINIC_COMPOUND_PROMPTS,
  DASHBOARD_CLINIC_COMPOUND_PROMPTS,
  PUBLIC_CLINIC_COMPOUND_PROMPTS,
} from './ai-clinic-compound.fixtures.js';
import {
  classifyClinicCompoundSegment,
  decomposeClinicCompoundPrompt,
  decomposeCustomerClinicCompoundPrompt,
  decomposeDashboardClinicCompoundPrompt,
  decomposePublicClinicCompoundPrompt,
  isAnyClinicCompoundPrompt,
  isClinicCompoundPrompt,
  isClinicLabBookSegment,
  isClinicResultFollowUpSegment,
  rescueClinicCompoundIntent,
} from './ai-clinic-compound.util.js';
import {
  decomposeDeterministicForSurface,
  matchGoldenCompoundPattern,
} from './intent-decomposition.util.js';

describe('ai-clinic-compound.util (ai-cmd-clinic-v2-7)', () => {
  it.each(DASHBOARD_CLINIC_COMPOUND_PROMPTS)(
    'detects dashboard compound $id',
    ({ prompt, surface }) => {
      expect(isClinicCompoundPrompt(prompt, surface)).toBe(true);
    },
  );

  it.each(CUSTOMER_CLINIC_COMPOUND_PROMPTS)(
    'detects customer compound $id',
    ({ prompt, surface }) => {
      expect(isClinicCompoundPrompt(prompt, surface)).toBe(true);
    },
  );

  it.each(PUBLIC_CLINIC_COMPOUND_PROMPTS)(
    'detects public compound $id',
    ({ prompt, surface }) => {
      expect(isClinicCompoundPrompt(prompt, surface)).toBe(true);
    },
  );

  it.each(CLINIC_COMPOUND_SCENARIOS)(
    'decomposes $surface compound $id',
    ({ prompt, surface, orderedActions }) => {
      const steps = decomposeClinicCompoundPrompt(prompt, surface);
      expect(steps.length).toBeGreaterThanOrEqual(2);
      expect(steps.map((step) => step.action)).toEqual(orderedActions);
    },
  );

  it.each(CLINIC_COMPOUND_RESCUE_SCENARIOS)(
    'rescues misclassified compound $id',
    ({ prompt, misclassifiedAction }) => {
      expect(rescueClinicCompoundIntent(prompt, misclassifiedAction!)).toEqual({
        action: 'compound_intent',
        rescueReason: 'clinic_compound',
      });
    },
  );

  it('classifies dashboard abnormal list + explain segments', () => {
    const listStep = classifyClinicCompoundSegment(
      'List abnormal results for Maria',
      'dashboard',
    );
    expect(listStep?.action).toBe('list_abnormal_results');
    expect(listStep?.params.customerName).toBe('Maria');

    const explainStep = classifyClinicCompoundSegment(
      'explain her lab results',
      'dashboard',
    );
    expect(explainStep?.action).toBe('explain_patient_results');
  });

  it('classifies dashboard notify segment', () => {
    const step = classifyClinicCompoundSegment(
      'notify her when results are ready',
      'dashboard',
    );
    expect(step?.action).toBe('notify_patient_result_ready');
  });

  it('classifies consumer follow-up segment as explain_result_status', () => {
    const step = classifyClinicCompoundSegment(
      'notify me when results are ready',
      'customer',
    );
    expect(step?.action).toBe('explain_result_status');
    expect(
      isClinicResultFollowUpSegment(
        'notify me when results are ready',
        'customer',
      ),
    ).toBe(true);
  });

  it('matches golden patterns for dashboard and customer', () => {
    const dashboard = matchGoldenCompoundPattern(
      'dashboard',
      DASHBOARD_CLINIC_COMPOUND_PROMPTS[0].prompt,
    );
    expect(dashboard?.recipeId).toBe('dashboard_clinic_compound');
    expect(dashboard?.steps.map((step) => step.action)).toEqual([
      'create_test_order',
      'notify_patient_result_ready',
    ]);

    const customer = matchGoldenCompoundPattern(
      'customer',
      CUSTOMER_CLINIC_COMPOUND_PROMPTS[0].prompt,
    );
    expect(customer?.recipeId).toBe('customer_clinic_compound');
    expect(customer?.steps.map((step) => step.action)).toEqual([
      'book_nearest_slot',
      'explain_result_status',
    ]);
  });

  it('decomposes deterministically per surface recipe', () => {
    const dashboard = decomposeDeterministicForSurface(
      'dashboard',
      DASHBOARD_CLINIC_COMPOUND_PROMPTS[0].prompt,
    );
    expect(dashboard?.recipeId).toBe('dashboard_clinic_compound');
    expect(
      decomposeDashboardClinicCompoundPrompt(dashboard!.steps[0].segment!),
    ).toBeDefined();

    const customer = decomposeDeterministicForSurface(
      'customer',
      CUSTOMER_CLINIC_COMPOUND_PROMPTS[0].prompt,
    );
    expect(customer?.recipeId).toBe('customer_clinic_compound');
    expect(
      decomposeCustomerClinicCompoundPrompt(customer!.steps[0].segment!),
    ).toBeDefined();

    const pub = decomposeDeterministicForSurface(
      'public',
      PUBLIC_CLINIC_COMPOUND_PROMPTS[0].prompt,
    );
    expect(pub?.recipeId).toBe('public_clinic_compound');
    expect(
      decomposePublicClinicCompoundPrompt(pub!.steps[0].segment!),
    ).toBeDefined();
  });

  it('does not treat unrelated compounds as clinic compounds', () => {
    expect(
      isAnyClinicCompoundPrompt('Book massage and pay cash at visit'),
    ).toBe(false);
    expect(
      rescueClinicCompoundIntent(
        'Book massage and pay cash at visit',
        'book_package',
      ),
    ).toBeNull();
  });
});
