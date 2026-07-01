import { PROVIDER_ONBOARDING_COMPOUND_PROMPTS } from './ai-provider-onboarding-compound.fixtures.js';
import { PROVIDER_ONBOARDING_MULTILINGUAL_SCENARIOS } from './ai-provider-onboarding-compound-multilingual.fixtures.js';
import {
  buildProviderOnboardingCompoundParams,
  decomposeProviderOnboardingCompoundPrompt,
  extractAssignServiceNamesFromPrompt,
  extractOnboardingEmployeeNameFromPrompt,
  extractOnboardingTemplateName,
  isProviderOnboardingCompoundPrompt,
  PROVIDER_ONBOARDING_COMPOUND_STEP_ACTIONS,
} from './ai-provider-onboarding-compound.util.js';

describe('ai-provider-onboarding-compound.util (ai-cmd-ext-4.1)', () => {
  it.each(PROVIDER_ONBOARDING_COMPOUND_PROMPTS)(
    'isProviderOnboardingCompoundPrompt $id',
    ({ prompt }) => {
      expect(isProviderOnboardingCompoundPrompt(prompt)).toBe(true);
    },
  );

  it.each(PROVIDER_ONBOARDING_COMPOUND_PROMPTS)(
    'decomposeProviderOnboardingCompoundPrompt $id',
    ({ prompt, orderedActions, expectedParams }) => {
      const steps = decomposeProviderOnboardingCompoundPrompt(prompt);
      expect(steps.map((step) => step.action)).toEqual([...orderedActions]);
      expect(steps).toHaveLength(
        PROVIDER_ONBOARDING_COMPOUND_STEP_ACTIONS.length,
      );
      if (expectedParams?.employeeName) {
        expect(steps[0].params.employeeName).toBe(expectedParams.employeeName);
        expect(steps[1].params.employeeName).toBe(expectedParams.employeeName);
      }
      if (expectedParams?.serviceNames) {
        expect(steps[1].params.serviceNames).toEqual(
          expectedParams.serviceNames,
        );
      }
      if (expectedParams?.templateName) {
        expect(steps[2].params.templateName).toBe(expectedParams.templateName);
      }
      if (typeof expectedParams?.enabled === 'boolean') {
        expect(steps[3].params.enabled).toBe(expectedParams.enabled);
      }
    },
  );

  it.each(PROVIDER_ONBOARDING_MULTILINGUAL_SCENARIOS)(
    'decomposeProviderOnboardingCompoundPrompt multilingual $id',
    ({ prompt, orderedActions }) => {
      const steps = decomposeProviderOnboardingCompoundPrompt(prompt);
      expect(steps.map((step) => step.action)).toEqual([...orderedActions]);
    },
  );

  it('does not treat single create_employee as onboarding compound', () => {
    expect(isProviderOnboardingCompoundPrompt('Create employee Anna')).toBe(
      false,
    );
    expect(
      decomposeProviderOnboardingCompoundPrompt('Create employee Anna'),
    ).toEqual([]);
  });

  it('extractAssignServiceNamesFromPrompt and template helpers', () => {
    expect(
      extractAssignServiceNamesFromPrompt(
        'assign haircut and color services to Anna',
      ),
    ).toEqual(['haircut', 'color']);
    expect(
      extractAssignServiceNamesFromPrompt(
        'onboard provider with waxing skills',
      ),
    ).toEqual(['waxing']);
    expect(
      extractOnboardingTemplateName('set up first week from weekday template'),
    ).toBe('weekday');
    expect(extractOnboardingTemplateName('apply weekend template')).toBe(
      'weekend',
    );
    const params = buildProviderOnboardingCompoundParams(
      'Onboard stylist Anna end-to-end: create employee, assign massage services, first week weekday template, enable online booking',
    );
    expect(params.employeeName).toBe('Anna');
    expect(params.serviceNames).toEqual(['massage']);
  });

  it('extractOnboardingEmployeeNameFromPrompt handles provider role phrasing', () => {
    expect(
      extractOnboardingEmployeeNameFromPrompt(
        'Provider onboarding end-to-end for Sofia',
      ),
    ).toBe('Sofia');
    expect(
      extractOnboardingEmployeeNameFromPrompt(
        'Get new nail tech Nina ready end-to-end',
      ),
    ).toBe('Nina');
    expect(
      extractOnboardingEmployeeNameFromPrompt('Set up for new therapist Maria'),
    ).toBe('Maria');
    expect(
      extractOnboardingEmployeeNameFromPrompt(
        'Provider onboarding end-to-end Sofia-ի համար — create employee',
      ),
    ).toBe('Sofia');
    expect(
      extractOnboardingEmployeeNameFromPrompt(
        'Provider onboarding end-to-end для Sofia — create employee',
      ),
    ).toBe('Sofia');
    expect(
      extractOnboardingEmployeeNameFromPrompt(
        'set up first week schedule from weekday template',
      ),
    ).toBeNull();
    expect(extractOnboardingEmployeeNameFromPrompt('hire employee')).toBeNull();
  });

  it('rejects prompts without enough onboarding steps', () => {
    expect(
      isProviderOnboardingCompoundPrompt(
        'Onboard stylist Anna and assign haircut services',
      ),
    ).toBe(false);
  });
});
