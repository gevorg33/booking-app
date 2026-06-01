import { generateGiftCardCode, giftCardCodePrefix } from './gift-card-code.util.js';

describe('gift-card-code.util', () => {
  it('generates typed prefixes for monetary, service, and bundle cards', () => {
    expect(generateGiftCardCode('monetary')).toMatch(/^GCM-/);
    expect(generateGiftCardCode('service')).toMatch(/^GCS-/);
    expect(generateGiftCardCode('bundle')).toMatch(/^GCB-/);
    expect(giftCardCodePrefix('monetary')).toBe('GCM');
  });
});
