import {
  buildPipelineContext,
  pipelineContextFromNormalization,
} from './command-understanding-context.util.js';

describe('command-understanding-context.util (pipe-1.1.1)', () => {
  it('builds PipelineContext from normalization result', () => {
    const context = buildPipelineContext('  book first  ', {
      original: 'book first',
      normalized: 'book first',
      method: 'passthrough',
      classifierContext: null,
    });
    expect(context).toEqual({
      originalPrompt: 'book first',
      normalizedPrompt: 'book first',
      classifierContext: null,
      method: 'passthrough',
    });
  });

  it('preserves HY classifierContext on multilingual prompts', () => {
    const hyPrompt = 'Ցույց տուր ամրագրումները վաղը';
    const context = buildPipelineContext(hyPrompt, {
      original: hyPrompt,
      normalized: hyPrompt,
      method: 'multilingual',
      classifierContext: 'Armenian command — classify in Armenian.',
    });
    expect(context.method).toBe('multilingual');
    expect(context.classifierContext).toContain('Armenian');
    expect(context.normalizedPrompt).toBe(hyPrompt);
  });

  it('pipelineContextFromNormalization mirrors normalization fields', () => {
    const normalization = {
      original: 'Запиши на завтра',
      normalized: 'Запиши на завтра',
      method: 'multilingual' as const,
      classifierContext: 'Russian command context',
    };
    expect(pipelineContextFromNormalization(normalization)).toEqual({
      originalPrompt: 'Запиши на завтра',
      normalizedPrompt: 'Запиши на завтра',
      classifierContext: 'Russian command context',
      method: 'multilingual',
    });
  });
});
