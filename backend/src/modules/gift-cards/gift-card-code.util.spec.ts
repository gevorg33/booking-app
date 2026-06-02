import { generateGiftCardCode, giftCardCodePrefix } from './gift-card-code.util.js';

describe('gift-card-code.util', () => {
  it('generates typed prefixes for monetary, service, bundle, package, and subscription cards', () => {
    expect(generateGiftCardCode('monetary')).toMatch(/^GCM-/);
    expect(generateGiftCardCode('service')).toMatch(/^GCS-/);
    expect(generateGiftCardCode('bundle')).toMatch(/^GCB-/);
    expect(generateGiftCardCode('package')).toMatch(/^GCP-/);
    expect(generateGiftCardCode('subscription')).toMatch(/^GCU-/);
    expect(giftCardCodePrefix('package')).toBe('GCP');
    expect(giftCardCodePrefix('subscription')).toBe('GCU');
  });
});
