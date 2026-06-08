import {
  applyClarifyMemoryToParams,
  absorbIncomingClarifyAnswers,
  buildAnswerReuseSessionContext,
  buildSmartClarifyAnswerReuseSessionContext,
  extractClarifyMemoryEntityAliases,
  fieldAnsweredInClarifySession,
  filterIssuesAnsweredInSession,
  mergeClarifyMemoryIntoLearnPayload,
  promoteParamsToClarifyMemory,
  readClarifyMemory,
  recordClarifyAnswerInSession,
  syncSessionContextFromClarifyMemory,
} from './ai-clarify-answer-reuse.util.js';
import { CLARIFY_ANSWER_REUSE_SCENARIOS } from './ai-clarify-answer-reuse.fixtures.js';
import { buildTargetedSlotClarify } from './ai-smart-clarify.util.js';
import { fieldConfidenceToValidationIssues } from './ai-classification-field-confidence.util.js';

describe('ai-clarify-answer-reuse.util (acc-4.4)', () => {
  it.each(CLARIFY_ANSWER_REUSE_SCENARIOS)('$id answer reuse', (scenario) => {
    let session = syncSessionContextFromClarifyMemory(scenario.sessionContext ?? {});
    if (scenario.incomingAnswers) {
      session = absorbIncomingClarifyAnswers(session, scenario.incomingAnswers);
    }

    const params = applyClarifyMemoryToParams(scenario.params ?? {}, session);

    if (scenario.expectParams) {
      for (const [key, value] of Object.entries(scenario.expectParams)) {
        expect(params[key]).toBe(value);
      }
    }

    if (scenario.expectMemory) {
      expect(readClarifyMemory(session)).toMatchObject(scenario.expectMemory);
      const recorded = recordClarifyAnswerInSession(session, scenario.incomingAnswers ?? {});
      expect(readClarifyMemory(recorded)).toMatchObject(scenario.expectMemory);
    }

    if (scenario.expectSkippedFields?.length) {
      for (const field of scenario.expectSkippedFields) {
        expect(fieldAnsweredInClarifySession(field, session, params)).toBe(true);
      }
    }

    if (scenario.expectMissingFields?.length) {
      const candidateFields = [
        'serviceName',
        'employeeName',
        'date',
        'timeSlot',
        'customerName',
      ];
      const issues = fieldConfidenceToValidationIssues(candidateFields);
      const filtered = filterIssuesAnsweredInSession(issues, session, params);
      expect(filtered.map((row) => row.field)).toEqual(scenario.expectMissingFields);
    }

    if (scenario.expectAliases) {
      const aliases = extractClarifyMemoryEntityAliases(
        scenario.prompt,
        readClarifyMemory(session),
      );
      for (const [alias, entry] of Object.entries(scenario.expectAliases)) {
        expect(aliases[alias]).toMatchObject(entry);
      }
    }
  });

  it('buildSmartClarifyAnswerReuseSessionContext promotes partial params into memory', () => {
    const session = buildSmartClarifyAnswerReuseSessionContext(
      { _clarifyMemory: { employeeName: 'Gevorg' } },
      {
        success: false,
        action: 'create_booking',
        summary: 'Need service',
        details: {
          clarifyContext: {
            originalPrompt: 'book tomorrow',
            originalAction: 'create_booking',
            partialParams: { date: '2026-06-08', employeeName: 'Gevorg' },
            clarifyRound: 1,
            clarifyKind: 'targeted_slots',
          },
          partialParams: { date: '2026-06-08', employeeName: 'Gevorg' },
        },
      },
    );
    expect(readClarifyMemory(session)).toMatchObject({
      employeeName: 'Gevorg',
      date: '2026-06-08',
    });
    expect(session.date).toBe('2026-06-08');
  });

  it('mergeClarifyMemoryIntoLearnPayload exposes clarify answers to entity memory', () => {
    const payload = mergeClarifyMemoryIntoLearnPayload(
      { action: 'create_booking' },
      { _clarifyMemory: { employeeName: 'Anna Smith', serviceName: 'Massage' } },
    );
    expect(payload.employeeName).toBe('Anna Smith');
    expect(payload.serviceName).toBe('Massage');
    expect(payload._clarifyMemory).toEqual({
      employeeName: 'Anna Smith',
      serviceName: 'Massage',
    });
  });

  it('buildTargetedSlotClarify skips fields already in clarify memory', () => {
    const clarify = buildTargetedSlotClarify({
      prompt: 'book massage with Gevorg',
      surface: 'dashboard',
      action: 'create_booking',
      params: { employeeName: 'Gevorg' },
      sessionContext: { _clarifyMemory: { date: '2026-06-08', timeSlot: '10:00' } },
      resolved: {
        action: 'create_booking',
        prompt: 'book massage with Gevorg',
        businessId: 'b1',
        params: { employeeName: 'Gevorg' },
        entities: {},
        enrichedParams: {
          employeeName: 'Gevorg',
          date: '2026-06-08',
          timeSlot: '10:00',
        },
        reasoning: 'booking',
      },
    });
    expect(clarify?.details.missing?.map((row) => row.field)).not.toContain('date');
    expect(clarify?.details.missing?.map((row) => row.field)).not.toContain('timeSlot');
  });

  it('promoteParamsToClarifyMemory keeps prior answers', () => {
    expect(
      promoteParamsToClarifyMemory(
        { serviceName: 'Swedish Massage' },
        { employeeName: 'Maria', date: '2026-06-08' },
      ),
    ).toEqual({
      employeeName: 'Maria',
      date: '2026-06-08',
      serviceName: 'Swedish Massage',
    });
  });

  it('buildAnswerReuseSessionContext mirrors memory to session keys', () => {
    const session = buildAnswerReuseSessionContext(undefined, {
      partialParams: { serviceName: 'Facial', timeSlot: '15:00' },
      incomingMemory: { employeeName: 'Anna Smith' },
    });
    expect(session.employeeName).toBe('Anna Smith');
    expect(session.serviceName).toBe('Facial');
    expect(session.timeSlot).toBe('15:00');
  });
});
