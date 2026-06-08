import { FIELD_CONFIDENCE_SCENARIOS } from './ai-classification-field-confidence.fixtures.js';
import {
  attachFieldConfidenceMetadata,
  buildFieldConfidenceClarifyIfNeeded,
  deriveFieldLevelConfidence,
  fieldConfidenceToValidationIssues,
  listLowConfidenceFields,
} from './ai-classification-field-confidence.util.js';

describe('ai-classification-field-confidence.util (acc-3.6)', () => {
  it.each(FIELD_CONFIDENCE_SCENARIOS.map((scenario) => [scenario.id, scenario]))(
    'field confidence scenario %s',
    (_id, scenario) => {
      const fieldConfidence = deriveFieldLevelConfidence(
        scenario.prompt,
        scenario.action,
        scenario.params,
        scenario.actionConfidence,
      );
      const lowFields = listLowConfidenceFields(
        fieldConfidence,
        scenario.action,
        scenario.params,
      );
      for (const field of scenario.expectLowFields) {
        expect(lowFields).toContain(field);
      }
      const clarify = buildFieldConfidenceClarifyIfNeeded({
        prompt: scenario.prompt,
        surface: scenario.surface,
        action: scenario.action,
        params: scenario.params,
        confidence: scenario.actionConfidence,
        fieldConfidence,
      });
      if (scenario.expectTargetedClarify) {
        expect(clarify).not.toBeNull();
        expect(clarify?.details.clarifyFields?.length).toBeGreaterThan(0);
        expect(clarify?.details.clarifySource).toBe('field_confidence');
      } else if (scenario.actionConfidence >= 0.55) {
        expect(clarify).toBeNull();
      }
    },
  );

  it('attachFieldConfidenceMetadata stores _fieldConfidence and _lowConfidenceFields', () => {
    const intent = {
      action: 'create_booking',
      params: { employeeName: 'Gevorg', timeSlot: '10:00' } as Record<
        string,
        unknown
      >,
      confidence: 0.84,
    };
    const fieldConfidence = deriveFieldLevelConfidence(
      'Book with Gevorg tomorrow at 10:00',
      intent.action,
      intent.params,
      0.84,
    );
    attachFieldConfidenceMetadata(
      'Book with Gevorg tomorrow at 10:00',
      'dashboard',
      intent,
      fieldConfidence,
    );
    expect(intent.params._fieldConfidence).toEqual(fieldConfidence);
    expect(intent.params._lowConfidenceFields).toContain('serviceName');
  });

  it('fieldConfidenceToValidationIssues maps to validator-shaped missing fields', () => {
    const issues = fieldConfidenceToValidationIssues(['serviceName', 'date']);
    expect(issues.map((issue) => issue.field)).toEqual(['serviceName', 'date']);
    expect(issues[0]?.label).toBe('Service');
  });

  it('targeted clarify omits action field from clarifyFields payload', () => {
    const clarify = buildFieldConfidenceClarifyIfNeeded({
      prompt: 'Book with Gevorg tomorrow at 10:00',
      surface: 'dashboard',
      action: 'create_booking',
      params: { employeeName: 'Gevorg', timeSlot: '10:00' },
      confidence: 0.86,
      fieldConfidence: deriveFieldLevelConfidence(
        'Book with Gevorg tomorrow at 10:00',
        'create_booking',
        { employeeName: 'Gevorg', timeSlot: '10:00' },
        0.86,
      ),
    });
    expect(clarify?.details.clarifyFields).not.toContain('action');
    expect(clarify?.details.needsClarification).toBe(true);
  });
});
