import {
  CLINIC_LIS_INBOUND_HL7_PAYLOAD,
  CLINIC_LIS_INBOUND_PARSE_SCENARIOS,
} from './clinic-lab-sync-inbound.fixtures.js';
import { parseHl7InboundClinicLabSyncObservationRequest } from './clinic-lab-sync-hl7.parser.util.js';

describe('clinic-lab-sync-hl7.parser.util', () => {
  it('parses ORU HL7 payloads into observation requests', () => {
    const parsed = parseHl7InboundClinicLabSyncObservationRequest(
      CLINIC_LIS_INBOUND_HL7_PAYLOAD,
    );

    expect(parsed.universalCode).toBe('CBC');
    expect(parsed.patientFirstName).toBe('Jane');
    expect(parsed.patientLastName).toBe('Doe');
    expect(parsed.observations[0].universalCode).toBe('WBC');
    expect(parsed.observations[0].resultValue).toBe('12.5');
  });

  it.each(
    CLINIC_LIS_INBOUND_PARSE_SCENARIOS.filter((item) => item.source === 'hl7'),
  )(
    'parses fixture scenario $id',
    ({ rawPayload, expectedUniversalCode, expectedObservationCode }) => {
      const parsed = parseHl7InboundClinicLabSyncObservationRequest(rawPayload);
      expect(parsed.universalCode).toBe(expectedUniversalCode);
      expect(parsed.observations[0].universalCode).toBe(
        expectedObservationCode,
      );
    },
  );

  it('requires PID, OBR, and OBX segments', () => {
    expect(() =>
      parseHl7InboundClinicLabSyncObservationRequest('MSH|^~\\&|LIS|LAB'),
    ).toThrow(
      'HL7 ORU payload requires PID, OBR, and at least one OBX segment',
    );
  });

  it('rejects OBX rows without result values', () => {
    expect(() =>
      parseHl7InboundClinicLabSyncObservationRequest(
        [
          'MSH|^~\\&|LIS|LAB|EMR|CLINIC|20260607100000||ORU^R01|MSG1|P|2.5',
          'PID|1||MRN-1001||Doe^Jane',
          'OBR|1||PL123|CBC^Complete blood count',
          'OBX|1|NM|WBC^WBC|||10^9/L',
        ].join('\r'),
      ),
    ).toThrow('HL7 OBX segment requires identifier and result value');
  });

  it('supports date-only HL7 timestamps and single-token patient names', () => {
    const parsed = parseHl7InboundClinicLabSyncObservationRequest(
      [
        'MSH|^~\\&|LIS|LAB|EMR|CLINIC|20260607||ORU^R01|MSG1|P|2.5',
        'PID|1||MRN-1001||PatientOnly||19900101',
        'OBR|1||PL123|CBC^Complete blood count',
        'OBX|1|NM|WBC^WBC||12.5',
      ].join('\r'),
    );

    expect(parsed.patientFirstName).toBe('PatientOnly');
    expect(parsed.patientLastName).toBe('PatientOnly');
    expect(parsed.patientDateOfBirth).toBe('1990-01-01T00:00:00.000Z');
  });

  it('rejects invalid HL7 dates and empty patient names', () => {
    expect(() =>
      parseHl7InboundClinicLabSyncObservationRequest(
        [
          'MSH|^~\\&|LIS|LAB|EMR|CLINIC|bad-date||ORU^R01|MSG1|P|2.5',
          'PID|1||MRN-1001||||',
          'OBR|1||PL123|CBC^Complete blood count',
          'OBX|1|NM|WBC^WBC||12.5',
        ].join('\r'),
      ),
    ).toThrow('HL7 PID segment is missing patient name');
  });

  it('accepts last-name-only HL7 patient names', () => {
    const parsed = parseHl7InboundClinicLabSyncObservationRequest(
      [
        'MSH|^~\\&|LIS|LAB|EMR|CLINIC|20260607||ORU^R01|MSG1|P|2.5',
        'PID|1||MRN-1001||^LastOnly',
        'OBR|1||PL123|CBC^Complete blood count',
        'OBX|1|NM|WBC^WBC||12.5',
      ].join('\r'),
    );

    expect(parsed.patientFirstName).toBe('LastOnly');
    expect(parsed.patientLastName).toBe('LastOnly');
  });

  it('accepts first-name-only HL7 patient names', () => {
    const parsed = parseHl7InboundClinicLabSyncObservationRequest(
      [
        'MSH|^~\\&|LIS|LAB|EMR|CLINIC|20260607||ORU^R01|MSG1|P|2.5',
        'PID|1||MRN-1001||^Jane',
        'OBR|1||PL123|CBC^Complete blood count',
        'OBX|1|NM|WBC^WBC||12.5|||||bad',
      ].join('\r'),
    );

    expect(parsed.patientFirstName).toBe('Jane');
    expect(parsed.patientLastName).toBe('Jane');
    expect(parsed.observations[0].observationDate).toBeUndefined();
  });

  it('rejects whitespace-only HL7 patient names', () => {
    expect(() =>
      parseHl7InboundClinicLabSyncObservationRequest(
        [
          'MSH|^~\\&|LIS|LAB|EMR|CLINIC|20260607||ORU^R01|MSG1|P|2.5',
          'PID|1||MRN-1001||^^',
          'OBR|1||PL123|CBC^Complete blood count',
          'OBX|1|NM|WBC^WBC||12.5',
        ].join('\r'),
      ),
    ).toThrow('HL7 PID segment has an empty patient name');
  });
});
