import { buildPublicClassifierContext } from './command-understanding-public.util.js';

describe('command-understanding-public.util (pipe-1.12.4)', () => {
  it('buildPublicClassifierContext uses narrow schema when shortlist provided', () => {
    const context = buildPublicClassifierContext({
      locale: 'en',
      businessContextBlock: 'Business: Demo\nServices: Haircut',
      pipelineContext: {
        originalPrompt: 'book',
        normalizedPrompt: 'book',
        classifierContext: null,
        method: 'passthrough',
      },
      narrowShortlist: ['check_availability', 'book_appointment'],
    });

    expect(context).toContain('check_availability');
    expect(context).toContain('book_appointment');
    expect(context).toContain('Business: Demo');
  });
});
