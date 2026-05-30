import { getBusinessAccountingIntegration } from './accounting-integration.types.js';

describe('accounting-integration.types', () => {
  it('returns empty accounting settings', () => {
    expect(getBusinessAccountingIntegration()).toEqual({});
  });

  it('reads accounting integration', () => {
    const settings = {
      integrations: {
        accounting: { enabled: true, provider: 'xero', accountCode: '200' },
      },
    };
    expect(getBusinessAccountingIntegration(settings).provider).toBe('xero');
  });
});
