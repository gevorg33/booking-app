import { mergeEnterpriseTrustSettings } from './enterprise-trust.types.js';

describe('enterprise-trust.types', () => {
  it('merges defaults and trims string fields', () => {
    expect(
      mergeEnterpriseTrustSettings({
        legalBusinessName: '  Acme  ',
        dpoEmail: ' dpo@acme.com ',
      }),
    ).toMatchObject({
      legalBusinessName: 'Acme',
      dpoEmail: 'dpo@acme.com',
    });
  });

  it('normalizes blank strings to null', () => {
    expect(mergeEnterpriseTrustSettings({ country: '   ' }).country).toBeNull();
  });
});
