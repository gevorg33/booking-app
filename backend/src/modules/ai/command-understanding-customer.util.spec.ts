import { buildCustomerClassifierContext } from './command-understanding-customer.util.js';

describe('command-understanding-customer.util (pipe-1.12.3)', () => {
  it('buildCustomerClassifierContext uses narrow schema when shortlist provided', () => {
    const context = buildCustomerClassifierContext({
      sessionContext: { _capabilityHints: 'Hints' },
      pipelineContext: {
        originalPrompt: 'book',
        normalizedPrompt: 'book',
        classifierContext: null,
        method: 'passthrough',
      },
      narrowShortlist: ['book_appointment', 'check_availability'],
    });

    expect(context).toContain('book_appointment');
    expect(context).toContain('check_availability');
    expect(context).toContain('Hints');
  });
});
