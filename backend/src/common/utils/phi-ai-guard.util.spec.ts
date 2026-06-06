import {
  assessPhiInAiContext,
  listPhiFieldsInValue,
  phiAiBlockMessage,
  redactPhiFromValue,
} from './phi-ai-guard.util.js';

describe('phi-ai-guard.util', () => {
  const hipaaSettings = {
    businessType: 'clinic',
    hipaa: { enabled: true, baaAcceptedAt: '2026-01-01' },
  };

  it('blocks AI context that contains registered PHI fields when HIPAA is on', () => {
    const assessment = assessPhiInAiContext(hipaaSettings, 'clinic', {
      context: { booking: { symptoms: 'headache' } },
    });
    expect(assessment.blocked).toBe(true);
    expect(assessment.matchedFields).toContain('symptoms');
    expect(phiAiBlockMessage()).toContain('HIPAA mode');
  });

  it('allows AI context without PHI when HIPAA is on', () => {
    expect(
      assessPhiInAiContext(hipaaSettings, 'clinic', {
        context: { serviceName: 'Consultation' },
      }).blocked,
    ).toBe(false);
  });

  it('allows PHI fields when HIPAA is off', () => {
    expect(
      assessPhiInAiContext(
        { businessType: 'clinic', hipaa: { enabled: false } },
        'clinic',
        { context: { symptoms: 'fever' } },
      ).blocked,
    ).toBe(false);
  });

  it('returns passthrough values for nullish redact input', () => {
    expect(redactPhiFromValue(null)).toBeNull();
    expect(redactPhiFromValue('plain')).toBe('plain');
    expect(listPhiFieldsInValue(null)).toEqual([]);
  });

  it('stops PHI traversal beyond depth limit', () => {
    const deep = { a: { b: { c: { d: { e: { symptoms: 'hidden' } } } } } };
    expect(listPhiFieldsInValue(deep)).toEqual([]);
  });

  it('allows AI context when HIPAA on but context is empty', () => {
    expect(
      assessPhiInAiContext(hipaaSettings, 'clinic', { context: null }).blocked,
    ).toBe(false);
  });

  it('traverses top-level arrays when listing and redacting PHI', () => {
    expect(listPhiFieldsInValue([{ symptoms: 'fever' }])).toContain('symptoms');
    expect(redactPhiFromValue([{ notes: 'clinical' }])).toEqual([
      { notes: '[REDACTED_PHI]' },
    ]);
  });

  it('lists and redacts nested PHI registry fields', () => {
    const payload = {
      referralNotes: 'Dr A',
      nested: { patient_test_results: [{ notes: 'high' }] },
    };
    expect(listPhiFieldsInValue(payload)).toEqual(
      expect.arrayContaining(['referralNotes', 'patient_test_results']),
    );
    expect(redactPhiFromValue(payload)).toEqual({
      referralNotes: '[REDACTED_PHI]',
      nested: { patient_test_results: [{ notes: '[REDACTED_PHI]' }] },
    });
  });

  it('preserves non-object patient_test_results entries when redacting', () => {
    expect(
      redactPhiFromValue({
        patient_test_results: [null, 'invalid', { notes: 'lab' }],
      }),
    ).toEqual({
      patient_test_results: [null, 'invalid', { notes: '[REDACTED_PHI]' }],
    });
  });

  it('leaves patient_test_results rows without notes unchanged', () => {
    expect(
      redactPhiFromValue({
        patient_test_results: [{ result: 'normal' }],
      }),
    ).toEqual({
      patient_test_results: [{ result: 'normal' }],
    });
  });
});
