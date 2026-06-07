import {
  APPLY_CLINIC_PLAYBOOK_PROMPTS,
  CONFIGURE_CLINIC_SERVICE_PROMPTS,
  EXPLAIN_CLINIC_SERVICES_PROMPTS,
} from './ai-clinic-service.fixtures.js';
import { MULTILINGUAL_CLINIC_SERVICE_EVAL_SCENARIOS } from './ai-clinic-service-multilingual.fixtures.js';
import {
  isApplyClinicPlaybookPrompt,
  isConfigureClinicServicePrompt,
  isExplainClinicServicesPrompt,
  parseApplyClinicPlaybookFromPrompt,
  parseConfigureClinicServiceFromPrompt,
  parseExplainClinicServicesFromPrompt,
  rescueApplyClinicPlaybookIntent,
  rescueConfigureClinicServiceIntent,
  rescueExplainClinicServicesIntent,
} from './ai-clinic-service.util.js';

describe('ai-clinic-service.util (ai-cmd-clinic-1)', () => {
  it.each(CONFIGURE_CLINIC_SERVICE_PROMPTS)(
    'detects configure clinic service prompt $id',
    ({ prompt }) => {
      expect(isConfigureClinicServicePrompt(prompt)).toBe(true);
    },
  );

  it.each(CONFIGURE_CLINIC_SERVICE_PROMPTS)(
    'parses configure clinic service prompt $id',
    ({
      prompt,
      serviceName,
      serviceType,
      requiresFasting,
      preparationNotes,
    }) => {
      const parsed = parseConfigureClinicServiceFromPrompt(prompt);
      expect(parsed).not.toBeNull();
      if (serviceName) {
        expect(parsed?.serviceName?.toLowerCase()).toContain(
          serviceName.toLowerCase(),
        );
      }
      if (serviceType) expect(parsed?.serviceType).toBe(serviceType);
      if (requiresFasting !== undefined) {
        expect(parsed?.requiresFasting).toBe(requiresFasting);
      }
      if (preparationNotes) {
        expect(parsed?.preparationNotes?.toLowerCase()).toContain(
          preparationNotes.toLowerCase(),
        );
      }
    },
  );

  it('rescues unknown action to configure_clinic_service', () => {
    expect(
      rescueConfigureClinicServiceIntent(
        'Mark CBC as a lab test requiring fasting',
        'unknown',
      ),
    ).toEqual({
      action: 'configure_clinic_service',
      rescueReason: 'configure_clinic_service',
    });
  });

  it('does not rescue when action is already configure_clinic_service', () => {
    expect(
      rescueConfigureClinicServiceIntent(
        'Mark CBC as a lab test requiring fasting',
        'configure_clinic_service',
      ),
    ).toBeNull();
  });

  it('does not steal create_test_order prompts', () => {
    const prompt = 'Order CBC and lipid panel for Maria visit tomorrow';
    expect(isConfigureClinicServicePrompt(prompt)).toBe(false);
    expect(rescueConfigureClinicServiceIntent(prompt, 'unknown')).toBeNull();
  });

  it('does not steal explain_clinic_booking checkout prompts', () => {
    const prompt =
      'Why do I need to enter symptoms on the booking page checkout?';
    expect(isConfigureClinicServicePrompt(prompt)).toBe(false);
    expect(isExplainClinicServicesPrompt(prompt)).toBe(false);
  });
});

describe('ai-clinic-service explain util (ai-cmd-clinic-2)', () => {
  it.each(EXPLAIN_CLINIC_SERVICES_PROMPTS)(
    'detects explain clinic services prompt $id',
    ({ prompt }) => {
      expect(isExplainClinicServicesPrompt(prompt)).toBe(true);
      expect(isConfigureClinicServicePrompt(prompt)).toBe(false);
    },
  );

  it.each(EXPLAIN_CLINIC_SERVICES_PROMPTS)(
    'parses explain clinic services prompt $id',
    ({ prompt, serviceName }) => {
      const parsed = parseExplainClinicServicesFromPrompt(prompt);
      expect(parsed).not.toBeNull();
      if (serviceName) {
        expect(parsed?.serviceName?.toLowerCase()).toContain(
          serviceName.toLowerCase(),
        );
      }
    },
  );

  it('rescues unknown action to explain_clinic_services', () => {
    expect(
      rescueExplainClinicServicesIntent(
        'Which lab tests require fasting?',
        'unknown',
      ),
    ).toEqual({
      action: 'explain_clinic_services',
      rescueReason: 'explain_clinic_services',
    });
  });
});

describe('ai-clinic-service playbook util (ai-cmd-clinic-3)', () => {
  it.each(APPLY_CLINIC_PLAYBOOK_PROMPTS)(
    'detects apply clinic playbook prompt $id',
    ({ prompt }) => {
      expect(isApplyClinicPlaybookPrompt(prompt)).toBe(true);
      expect(parseApplyClinicPlaybookFromPrompt(prompt)).toEqual({});
    },
  );

  it('rescues unknown action to apply_clinic_playbook', () => {
    expect(
      rescueApplyClinicPlaybookIntent('Apply clinic playbook', 'unknown'),
    ).toEqual({
      action: 'apply_clinic_playbook',
      rescueReason: 'apply_clinic_playbook',
    });
  });
});

describe('ai-clinic-service multilingual util (ai-cmd-clinic-4)', () => {
  it.each(MULTILINGUAL_CLINIC_SERVICE_EVAL_SCENARIOS)(
    'detects multilingual clinic service prompt $id',
    ({ prompt, expectedAction }) => {
      if (expectedAction === 'configure_clinic_service') {
        expect(isConfigureClinicServicePrompt(prompt)).toBe(true);
      } else if (expectedAction === 'explain_clinic_services') {
        expect(isExplainClinicServicesPrompt(prompt)).toBe(true);
      } else {
        expect(isApplyClinicPlaybookPrompt(prompt)).toBe(true);
      }
    },
  );
});
