import {
  N99_FEWSHOT_RETRIEVAL_SCENARIOS,
} from './ai-n99-fewshot-retrieval.fixtures.js';
import {
  evaluateN99FewShotRetrievalScenario,
  isFewShotRetrievalEnabledByDefault,
  isRarePhrasingPrompt,
  resolveFewShotRetrievalLimit,
  retrieveN99FewShotExamplesLexical,
} from './ai-n99-fewshot-retrieval.util.js';

describe('ai-n99-fewshot-retrieval.util (n99-2.4)', () => {
  it('keeps few-shot retrieval enabled by default', () => {
    expect(isFewShotRetrievalEnabledByDefault()).toBe(true);
  });

  it('raises top-K for rare phrasing prompts', () => {
    expect(
      resolveFewShotRetrievalLimit({
        prompt: 'Register Maria for facemassage tomorrow at two pm',
      }),
    ).toBeGreaterThan(
      resolveFewShotRetrievalLimit({
        prompt: 'Book massage with Gevorg tomorrow at 10:00',
      }),
    );
  });

  it('detects rare phrasing markers across locales', () => {
    expect(isRarePhrasingPrompt('Put Maria on the books for facemassage tomorrow')).toBe(true);
    expect(isRarePhrasingPrompt('Оформи запись Maria на facemassage завтра')).toBe(true);
    expect(isRarePhrasingPrompt('Book massage with Gevorg tomorrow at 10:00')).toBe(false);
  });

  it.each(N99_FEWSHOT_RETRIEVAL_SCENARIOS)(
    '$id retrieves labeled few-shot action for rare phrasing',
    (scenario) => {
      const result = evaluateN99FewShotRetrievalScenario(scenario);
      expect(result.errors).toEqual([]);
      expect(result.passed).toBe(true);
      expect(result.examples.some((entry) => entry.action === scenario.expectedAction)).toBe(
        true,
      );
    },
  );

  it('prioritizes semantic paraphrase pool entries for rare dashboard booking prompts', () => {
    const examples = retrieveN99FewShotExamplesLexical({
      prompt: 'Register Maria for facemassage tomorrow at two pm',
      surface: 'dashboard',
    });
    expect(examples.length).toBeGreaterThan(0);
    expect(examples.some((entry) => entry.action === 'create_booking')).toBe(true);
  });
});
