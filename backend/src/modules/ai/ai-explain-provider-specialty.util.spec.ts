import {
  CUSTOMER_PUBLIC_EXPLAIN_PROVIDER_SPECIALTY_CLASSIFIER_RULES,
  EXPLAIN_PROVIDER_SPECIALTY_PROMPTS,
  detectExplainProviderSpecialtyAction,
  enrichExplainProviderSpecialtyParamsFromPrompt,
  extractProviderNameFromPrompt,
  isExplainProviderSpecialtyPrompt,
  isSalonOrBusinessAboutPrompt,
  rescueExplainProviderSpecialtyIntent,
  resolveEmployeeByName,
  scoreEmployeeForSpecialtyTopic,
} from './ai-explain-provider-specialty.util.js';
import { EXPLAIN_PROVIDER_SPECIALTY_SALON_ABOUT_NEGATIVES } from './ai-explain-salon-profile.fixtures.js';
import { isExplainSalonProfilePrompt } from './ai-explain-salon-profile.util.js';
import { EXPLAIN_PROVIDER_SPECIALTY_MULTILINGUAL_SCENARIOS } from './ai-explain-provider-specialty-multilingual.fixtures.js';
import { AI_COMMAND_EVAL_EXPLAIN_PROVIDER_SPECIALTY_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';

describe('ai-explain-provider-specialty.util (ai-cmd-customer-4.1.6)', () => {
  it('exports classifier rules for explain_provider_specialty', () => {
    expect(
      CUSTOMER_PUBLIC_EXPLAIN_PROVIDER_SPECIALTY_CLASSIFIER_RULES,
    ).toContain('explain_provider_specialty');
    expect(
      CUSTOMER_PUBLIC_EXPLAIN_PROVIDER_SPECIALTY_CLASSIFIER_RULES,
    ).toContain('Who is best for curly hair?');
  });

  it.each(
    EXPLAIN_PROVIDER_SPECIALTY_PROMPTS.map((row) => [row.id, row] as const),
  )('detects provider specialty prompt $id', (_id, row) => {
    expect(isExplainProviderSpecialtyPrompt(row.prompt)).toBe(true);
    expect(detectExplainProviderSpecialtyAction(row.prompt)).toBe(
      row.expectedAction,
    );
  });

  it.each(
    EXPLAIN_PROVIDER_SPECIALTY_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects multilingual provider specialty prompt $id', (_id, row) => {
    expect(isExplainProviderSpecialtyPrompt(row.prompt)).toBe(true);
    expect(
      rescueExplainProviderSpecialtyIntent(row.prompt, 'unknown')?.action,
    ).toBe('explain_provider_specialty');
  });

  it.each(
    EXPLAIN_PROVIDER_SPECIALTY_PROMPTS.map((row) => [row.id, row] as const),
  )('rescues provider specialty prompt $id from unknown', (_id, row) => {
    const rescued = rescueExplainProviderSpecialtyIntent(row.prompt, 'unknown');
    expect(rescued?.action).toBe(row.expectedAction);
    expect(rescued?.rescueReason).toBe(row.rescueReason);
  });

  it('enriches aspect, providerName, and specialtyTopic params', () => {
    const named = enrichExplainProviderSpecialtyParamsFromPrompt(
      {},
      'Tell me about Anna',
    );
    expect(named.aspect).toBe('named_provider');
    expect(named.providerName).toBe('Anna');

    const topic = enrichExplainProviderSpecialtyParamsFromPrompt(
      {},
      'Who is best for curly hair?',
    );
    expect(topic.aspect).toBe('specialty_match');
    expect(topic.specialtyTopic).toBe('curly hair');
  });

  it('disambiguates ranked availability from provider specialty', () => {
    expect(
      isExplainProviderSpecialtyPrompt('Who is best for curly hair?'),
    ).toBe(true);
    expect(
      isExplainProviderSpecialtyPrompt(
        'Who is the best rated massage therapist this week?',
      ),
    ).toBe(false);
    expect(
      isExplainProviderSpecialtyPrompt('who is the best specialist for brows'),
    ).toBe(false);
  });

  // e2e-bug.191 — salon/business overview must not become named-provider specialty.
  it.each(
    EXPLAIN_PROVIDER_SPECIALTY_SALON_ABOUT_NEGATIVES.map(
      (row) => [row.id, row] as const,
    ),
  )('rejects salon/business about cue $id for specialty', (_id, row) => {
    expect(isSalonOrBusinessAboutPrompt(row.prompt)).toBe(true);
    expect(isExplainProviderSpecialtyPrompt(row.prompt)).toBe(false);
    expect(detectExplainProviderSpecialtyAction(row.prompt)).toBeNull();
    expect(
      rescueExplainProviderSpecialtyIntent(row.prompt, 'unknown'),
    ).toBeNull();
    expect(extractProviderNameFromPrompt(row.prompt)).toBeNull();
  });

  it('rescues slash business/salon info away from specialty into salon profile', () => {
    const prompt = 'Tell me about this business / salon info';
    expect(isExplainProviderSpecialtyPrompt(prompt)).toBe(false);
    expect(isExplainSalonProfilePrompt(prompt)).toBe(true);
    expect(
      rescueExplainProviderSpecialtyIntent(
        prompt,
        'explain_provider_specialty',
      ),
    ).toBeNull();
  });

  it('still treats named stylists as specialty, not salon about', () => {
    expect(isSalonOrBusinessAboutPrompt('Tell me about Anna')).toBe(false);
    expect(isExplainProviderSpecialtyPrompt('Tell me about Anna')).toBe(true);
    expect(extractProviderNameFromPrompt('Tell me about Anna')).toBe('Anna');
    expect(
      isExplainProviderSpecialtyPrompt("What is Gevorg's specialty?"),
    ).toBe(true);
  });

  it('scores employees by specialty topic overlap', () => {
    const score = scoreEmployeeForSpecialtyTopic({
      employeeName: 'Anna',
      metadata: { specialty: 'Curly hair and color' },
      serviceNames: ['Haircut', 'Color'],
      topic: 'curly hair',
    });
    expect(score).toBeGreaterThan(0);
    expect(
      resolveEmployeeByName([{ name: 'Anna Smith' }, { name: 'Maria' }], 'Anna')
        ?.name,
    ).toBe('Anna Smith');
  });

  it('maps fixtures to passing eval golden cases', () => {
    expect(
      EXPLAIN_PROVIDER_SPECIALTY_PROMPTS.filter(
        (row) => row.surface === 'customer',
      ).length,
    ).toBeGreaterThanOrEqual(10);
    expect(
      EXPLAIN_PROVIDER_SPECIALTY_PROMPTS.filter(
        (row) => row.surface === 'public',
      ).length,
    ).toBeGreaterThanOrEqual(10);
    expect(AI_COMMAND_EVAL_EXPLAIN_PROVIDER_SPECIALTY_CASES.length).toBe(
      EXPLAIN_PROVIDER_SPECIALTY_PROMPTS.length +
        EXPLAIN_PROVIDER_SPECIALTY_MULTILINGUAL_SCENARIOS.length,
    );
    for (const evalCase of AI_COMMAND_EVAL_EXPLAIN_PROVIDER_SPECIALTY_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).errors).toEqual([]);
    }
  });
});
