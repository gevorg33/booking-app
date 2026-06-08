import {
  buildResolutionAccuracyClarify,
  buildResolutionAccuracyClarifyResult,
  buildSyntheticResolved,
  detectSilentEmployeePick,
  scoreCatalogMatches,
  scoreEmployeeNameMatch,
  scoreServiceNameMatch,
  verifyResolutionAccuracy,
} from './ai-resolution-accuracy-guard.util.js';
import {
  RESOLUTION_GUARD_SMART_CLARIFY_SCENARIOS,
  RESOLUTION_VERIFY_SCENARIOS,
} from './ai-resolution-accuracy-guard.fixtures.js';
import { attachSmartClarifyMetadata, resolveSmartClarify } from './ai-smart-clarify.util.js';

describe('ai-resolution-accuracy-guard.util (acc-5.1)', () => {
  it.each(RESOLUTION_VERIFY_SCENARIOS)('$id verifyResolutionAccuracy', (scenario) => {
    const result = verifyResolutionAccuracy(scenario.resolved);
    expect(result.ok).toBe(scenario.expectOk);
    if (scenario.expectFields) {
      expect(result.issues.map((issue) => issue.field)).toEqual(
        expect.arrayContaining(scenario.expectFields),
      );
    }
  });

  it('detectSilentEmployeePick flags bound id with multiple candidates', () => {
    expect(detectSilentEmployeePick(RESOLUTION_VERIFY_SCENARIOS[2]!.resolved)).toBe(true);
    expect(detectSilentEmployeePick(RESOLUTION_VERIFY_SCENARIOS[1]!.resolved)).toBe(false);
  });

  it('scoreEmployeeNameMatch prefers exact and first-name matches', () => {
    expect(scoreEmployeeNameMatch('Gevorg', 'Gevorg')).toBe(1);
    expect(scoreEmployeeNameMatch('Anna', 'Anna Smith')).toBeGreaterThanOrEqual(0.9);
    expect(scoreEmployeeNameMatch('Jo', 'Jordan Lee')).toBeLessThan(0.72);
  });

  it('scoreCatalogMatches returns multiple strong Anna matches', () => {
    const matches = scoreCatalogMatches(
      [
        { id: 'e1', name: 'Anna Smith' },
        { id: 'e2', name: 'Anna Jones' },
      ],
      'Anna',
      scoreEmployeeNameMatch,
    );
    expect(matches.length).toBeGreaterThanOrEqual(2);
    expect(matches.every((row) => row.score >= 0.72)).toBe(true);
  });

  it('buildResolutionAccuracyClarifyResult attaches entity chips for ambiguity', () => {
    const scenario = RESOLUTION_VERIFY_SCENARIOS[0]!;
    const verification = verifyResolutionAccuracy(scenario.resolved);
    const result = buildResolutionAccuracyClarifyResult(scenario.resolved, verification);
    expect(result.details.clarifyKind).toBe('resolution_accuracy');
    expect(result.details.clarifySource).toBe('resolution_accuracy');
    expect(result.details.entityOptions?.length).toBeGreaterThanOrEqual(2);
  });

  it.each(RESOLUTION_GUARD_SMART_CLARIFY_SCENARIOS)(
    '$id buildResolutionAccuracyClarify',
    (scenario) => {
      const clarify = buildResolutionAccuracyClarify({
        prompt: scenario.prompt,
        surface: scenario.surface,
        action: scenario.action,
        params: scenario.params,
        employees: scenario.employees,
        services: scenario.services,
        customers: scenario.customers,
        resolved: scenario.resolved,
      });
      if (scenario.expectClarify) {
        expect(clarify).not.toBeNull();
        expect(clarify?.details.clarifyKind).toBe('resolution_accuracy');
        if (scenario.expectField) {
          expect(clarify?.details.missing?.[0]?.field).toBe(scenario.expectField);
        }
        if (scenario.expectEntityOptions) {
          expect(clarify?.details.entityOptions?.length).toBeGreaterThanOrEqual(
            scenario.expectEntityOptions,
          );
        }
      } else {
        expect(clarify).toBeNull();
      }
    },
  );

  it('resolveSmartClarify late phase prefers resolution guard over entity chips', () => {
    const scenario = RESOLUTION_GUARD_SMART_CLARIFY_SCENARIOS[0]!;
    const clarify = resolveSmartClarify({
      prompt: scenario.prompt,
      surface: scenario.surface,
      action: scenario.action,
      params: scenario.params,
      employees: scenario.employees,
      services: scenario.services,
      resolved: scenario.resolved,
      phase: 'late',
    });
    expect(clarify?.details.clarifyKind).toBe('resolution_accuracy');
  });

  it('buildSyntheticResolved does not silently bind employeeId for multiple matches', () => {
    const resolved = buildSyntheticResolved({
      prompt: 'book massage with Anna tomorrow',
      action: 'create_booking',
      params: { employeeName: 'Anna', serviceName: 'Massage' },
      employees: [
        { id: 'e1', name: 'Anna Smith' },
        { id: 'e2', name: 'Anna Jones' },
      ],
      services: [{ id: 's1', name: 'Massage' }],
    });
    expect(resolved.enrichedParams.employeeId).toBeUndefined();
    expect(resolved.entities.employeeId).toBeUndefined();
    expect(resolved.enrichedParams.employeeIds).toEqual(['e1', 'e2']);
  });

  it('attachSmartClarifyMetadata preserves resolution_accuracy kind', () => {
    const scenario = RESOLUTION_VERIFY_SCENARIOS[0]!;
    const verification = verifyResolutionAccuracy(scenario.resolved);
    const base = buildResolutionAccuracyClarifyResult(scenario.resolved, verification);
    const wrapped = attachSmartClarifyMetadata(base, 'resolution_accuracy', {
      prompt: scenario.resolved.prompt,
      surface: 'dashboard',
      action: scenario.resolved.action,
      params: scenario.resolved.params,
    });
    expect(wrapped.details.clarifyKind).toBe('resolution_accuracy');
  });

  it('scoreServiceNameMatch rejects very short service tokens', () => {
    expect(scoreServiceNameMatch('fac', 'Facial Treatment')).toBeLessThan(0.72);
  });
});
