import {
  CLINIC_LIS_INBOUND_PARSE_SCENARIOS,
  CLINIC_LIS_INBOUND_VENDOR_JSON_PAYLOAD,
} from './clinic-lab-sync-inbound.fixtures.js';
import { parseInboundClinicLabSyncPayload } from './clinic-lab-sync-inbound.parser.util.js';

describe('clinic-lab-sync-inbound.parser.util', () => {
  it.each(CLINIC_LIS_INBOUND_PARSE_SCENARIOS)(
    'dispatches parser for $id',
    ({
      source,
      rawPayload,
      expectedUniversalCode,
      expectedObservationCode,
    }) => {
      const parsed = parseInboundClinicLabSyncPayload({
        source,
        rawPayload,
        integrationVendorCode: 'GENERIC-LIS',
      });

      expect(parsed.universalCode).toBe(expectedUniversalCode);
      expect(parsed.integrationVendorCode).toBe('GENERIC-LIS');
      expect(parsed.observations[0].universalCode).toBe(
        expectedObservationCode,
      );
    },
  );

  it('rejects invalid vendor JSON payloads', () => {
    expect(() =>
      parseInboundClinicLabSyncPayload({
        source: 'vendor_json',
        rawPayload: JSON.stringify({ foo: 'bar' }),
      }),
    ).toThrow(
      'Vendor JSON payload must include observationRequest with observations',
    );

    expect(() =>
      parseInboundClinicLabSyncPayload({
        source: 'vendor_json',
        rawPayload: 'not-json',
      }),
    ).toThrow('Vendor JSON payload must be valid JSON');
  });

  it('applies labInfoId and handles direct vendor JSON payloads', () => {
    const parsed = parseInboundClinicLabSyncPayload({
      source: 'vendor_json',
      rawPayload: JSON.stringify(
        CLINIC_LIS_INBOUND_VENDOR_JSON_PAYLOAD.observationRequest,
      ),
      labInfoId: 'lab-info-1',
    });

    expect(parsed.labInfoId).toBe('lab-info-1');
  });

  it('rejects unsupported inbound sources', () => {
    expect(() =>
      parseInboundClinicLabSyncPayload({
        source: 'xml' as never,
        rawPayload: '<xml />',
      }),
    ).toThrow('Unsupported inbound source');
  });
});
