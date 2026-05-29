import { extractProviderFallbackFromPrompt } from './ai-intent-heuristics.js';

describe('ai-intent-heuristics', () => {
  const employees = [
    { id: '1', name: 'Gevorg Gasparyan' },
    { id: '2', name: 'Mary Torgomyan' },
  ];

  describe('extractProviderFallbackFromPrompt', () => {
    it('extracts ordered providers from conditional booking prompt', () => {
      const result = extractProviderFallbackFromPrompt(
        'Book facemassage on Gevorg tomorrow at 9; if not available then Mary; if not whoever is free',
        employees,
      );
      expect(result.providerFallbackNames).toEqual(['Gevorg Gasparyan', 'Mary Torgomyan']);
      expect(result.fallbackAnyProvider).toBe(true);
    });

    it('returns empty for simple booking without fallback language', () => {
      const result = extractProviderFallbackFromPrompt(
        'Book facemassage with Gevorg tomorrow at 10:00',
        employees,
      );
      expect(result.providerFallbackNames).toEqual([]);
      expect(result.fallbackAnyProvider).toBe(false);
    });
  });
});
