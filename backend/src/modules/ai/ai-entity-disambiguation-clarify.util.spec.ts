import {
  applyEntityDisambiguationFromSession,
  buildEntityDisambiguationClarifyResult,
  composeEntityDisambiguationFollowUp,
  detectEntityAmbiguity,
  entityDisambiguationSummary,
  findAmbiguousEmployees,
  findAmbiguousServices,
  pickPrimaryEntityAmbiguity,
} from './ai-entity-disambiguation-clarify.util.js';
import { ENTITY_DISAMBIGUATION_SCENARIOS } from './ai-entity-disambiguation-clarify.fixtures.js';
import { buildEntityDisambiguationClarify } from './ai-smart-clarify.util.js';

describe('ai-entity-disambiguation-clarify.util (acc-4.3)', () => {
  it.each(ENTITY_DISAMBIGUATION_SCENARIOS)(
    '$id entity disambiguation',
    (scenario) => {
      const clarify = buildEntityDisambiguationClarifyResult({
        prompt: scenario.prompt,
        action: scenario.action,
        params: scenario.params ?? {},
        sessionContext: scenario.sessionContext,
        employees: scenario.employees,
        services: scenario.services,
        customers: scenario.customers,
      });

      if (!scenario.expectClarify) {
        expect(clarify).toBeNull();
        return;
      }

      expect(clarify).not.toBeNull();
      const options = clarify?.details.entityOptions as Array<{
        field: string;
        label: string;
      }>;
      expect(options?.length).toBeGreaterThanOrEqual(2);

      if (scenario.expectField) {
        expect(options?.every((row) => row.field === scenario.expectField)).toBe(true);
      }

      if (scenario.expectOptionLabels) {
        const labels = options!.map((row) => row.label);
        for (const label of scenario.expectOptionLabels) {
          expect(labels).toContain(label);
        }
      }

      if (scenario.expectOptionCountAtLeast != null) {
        expect(options!.length).toBeGreaterThanOrEqual(scenario.expectOptionCountAtLeast);
      }

      if (scenario.expectSummaryIncludes) {
        expect(clarify?.summary.toLowerCase()).toContain(
          scenario.expectSummaryIncludes.toLowerCase(),
        );
      }
    },
  );

  it('findAmbiguousEmployees matches first-name mentions', () => {
    const options = findAmbiguousEmployees({
      prompt: 'book with Anna tomorrow',
      params: {},
      employees: [
        { id: '1', name: 'Anna Smith' },
        { id: '2', name: 'Anna Jones' },
      ],
    });
    expect(options).toHaveLength(2);
    expect(options.every((row) => row.field === 'employeeName')).toBe(true);
  });

  it('findAmbiguousServices matches shared catalog tokens', () => {
    const options = findAmbiguousServices({
      prompt: 'book massage tomorrow',
      params: {},
      services: [
        { id: '1', name: 'Swedish Massage' },
        { id: '2', name: 'Deep Tissue Massage' },
        { id: '3', name: 'Hot Stone Massage' },
      ],
    });
    expect(options.length).toBeGreaterThanOrEqual(3);
    expect(options.every((row) => row.field === 'serviceName')).toBe(true);
  });

  it('pickPrimaryEntityAmbiguity prefers provider when name is mentioned', () => {
    const options = pickPrimaryEntityAmbiguity({
      prompt: 'book massage with Anna',
      params: {},
      employees: [
        { id: '1', name: 'Anna Smith' },
        { id: '2', name: 'Anna Jones' },
      ],
      services: [
        { id: 's1', name: 'Swedish Massage' },
        { id: 's2', name: 'Deep Tissue Massage' },
      ],
    });
    expect(options[0]?.field).toBe('employeeName');
  });

  it('composeEntityDisambiguationFollowUp preserves original prompt', () => {
    expect(
      composeEntityDisambiguationFollowUp({
        field: 'employeeName',
        label: 'Anna Smith',
        originalPrompt: 'book with Anna',
      }),
    ).toBe('book with Anna. I meant Anna Smith.');
  });

  it('applyEntityDisambiguationFromSession merges chip memory into params', () => {
    const params = applyEntityDisambiguationFromSession(
      {},
      { _clarifyMemory: { employeeName: 'Anna Smith' } },
    );
    expect(params.employeeName).toBe('Anna Smith');
  });

  it('buildEntityDisambiguationClarify attaches smart clarify metadata', () => {
    const clarify = buildEntityDisambiguationClarify({
      prompt: 'book with Anna',
      surface: 'dashboard',
      action: 'create_booking',
      params: {},
      employees: [
        { id: '1', name: 'Anna Smith' },
        { id: '2', name: 'Anna Jones' },
      ],
    });
    expect(clarify?.details.clarifyKind).toBe('entity_disambiguation');
    expect(clarify?.summary).toBe(entityDisambiguationSummary('employeeName'));
  });

  it('detectEntityAmbiguity returns empty when clarify memory resolves field', () => {
    const options = detectEntityAmbiguity({
      prompt: 'book with Anna',
      params: {},
      sessionContext: { _clarifyMemory: { employeeName: 'Anna Smith' } },
      employees: [
        { id: '1', name: 'Anna Smith' },
        { id: '2', name: 'Anna Jones' },
      ],
    });
    expect(options).toEqual([]);
  });
});
