import {
  buildGdprMetadata,
  getCustomerGdpr,
} from './customer-privacy.types.js';

describe('customer-privacy.types', () => {
  it('returns empty gdpr when metadata missing', () => {
    expect(getCustomerGdpr()).toEqual({});
  });

  it('builds gdpr metadata with privacy and marketing consent', () => {
    const metadata = buildGdprMetadata(
      {},
      {
        privacyAccepted: true,
        marketingOptIn: true,
        source: 'checkout',
      },
    );
    expect(metadata.gdpr).toMatchObject({
      privacyVersion: '1.0',
      marketingOptIn: true,
      source: 'checkout',
    });
    expect(
      (metadata.gdpr as { privacyAcceptedAt?: string }).privacyAcceptedAt,
    ).toBeTruthy();
  });

  it('builds gdpr with privacy only', () => {
    const metadata = buildGdprMetadata(undefined, {
      privacyAccepted: true,
      privacyVersion: '2.0',
    });
    expect(metadata.gdpr).toMatchObject({ privacyVersion: '2.0' });
  });

  it('does not set marketing when undefined', () => {
    const metadata = buildGdprMetadata(
      { gdpr: { marketingOptIn: true } },
      { privacyAccepted: true },
    );
    expect((metadata.gdpr as { marketingOptIn?: boolean }).marketingOptIn).toBe(
      true,
    );
  });
});
