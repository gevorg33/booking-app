import {
  CLINIC_LIS_INBOUND_HL7_PAYLOAD,
  CLINIC_LIS_INBOUND_RESOLVE_SCENARIOS,
  CLINIC_LIS_INBOUND_WEBHOOK_SECRET,
} from './clinic-lab-sync-inbound.fixtures.js';
import {
  computeClinicLisInboundWebhookSignature,
  readClinicLisInboundWebhookSecret,
  resolveClinicLabSyncInboundSource,
  verifyClinicLisInboundWebhookSignature,
} from './clinic-lab-sync-inbound-webhook.util.js';

describe('clinic-lab-sync-inbound-webhook.util', () => {
  it('reads inbound webhook secret from business settings', () => {
    expect(
      readClinicLisInboundWebhookSecret({
        clinicLis: { inboundWebhookSecret: '  secret-value  ' },
      }),
    ).toBe('secret-value');
    expect(readClinicLisInboundWebhookSecret({})).toBeNull();
  });

  it('computes and verifies HMAC signatures', () => {
    const rawBody = Buffer.from('payload');
    const signature = computeClinicLisInboundWebhookSignature(
      CLINIC_LIS_INBOUND_WEBHOOK_SECRET,
      rawBody,
    );
    expect(
      verifyClinicLisInboundWebhookSignature(
        CLINIC_LIS_INBOUND_WEBHOOK_SECRET,
        rawBody,
        signature,
      ),
    ).toBe(true);
    expect(
      verifyClinicLisInboundWebhookSignature(
        CLINIC_LIS_INBOUND_WEBHOOK_SECRET,
        rawBody,
        'bad-signature',
      ),
    ).toBe(false);
  });

  it.each(CLINIC_LIS_INBOUND_RESOLVE_SCENARIOS)(
    'resolves inbound source for $id',
    ({ contentType, rawPayload, expectedSource }) => {
      expect(
        resolveClinicLabSyncInboundSource({ contentType, rawPayload }),
      ).toBe(expectedSource);
    },
  );

  it('supports explicit source override', () => {
    expect(
      resolveClinicLabSyncInboundSource({
        contentType: 'application/octet-stream',
        rawPayload: CLINIC_LIS_INBOUND_HL7_PAYLOAD,
        sourceOverride: 'hl7',
      }),
    ).toBe('hl7');
  });

  it('rejects unknown source overrides', () => {
    expect(() =>
      resolveClinicLabSyncInboundSource({
        contentType: 'application/json',
        rawPayload: '{}',
        sourceOverride: 'xml',
      }),
    ).toThrow('Unsupported inbound source override');
  });
});
