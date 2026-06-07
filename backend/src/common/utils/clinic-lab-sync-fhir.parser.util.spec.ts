import {
  CLINIC_LIS_INBOUND_FHIR_PAYLOAD,
  CLINIC_LIS_INBOUND_PARSE_SCENARIOS,
} from './clinic-lab-sync-inbound.fixtures.js';
import { parseFhirInboundClinicLabSyncObservationRequest } from './clinic-lab-sync-fhir.parser.util.js';

describe('clinic-lab-sync-fhir.parser.util', () => {
  it('parses FHIR bundles into observation requests', () => {
    const parsed = parseFhirInboundClinicLabSyncObservationRequest(
      JSON.stringify(CLINIC_LIS_INBOUND_FHIR_PAYLOAD),
    );

    expect(parsed.universalCode).toBe('CBC');
    expect(parsed.patientFirstName).toBe('Jane');
    expect(parsed.observations[0].universalCode).toBe('WBC');
    expect(parsed.observations[0].resultValue).toBe('12.5');
  });

  it.each(
    CLINIC_LIS_INBOUND_PARSE_SCENARIOS.filter((item) => item.source === 'fhir'),
  )(
    'parses fixture scenario $id',
    ({ rawPayload, expectedUniversalCode, expectedObservationCode }) => {
      const parsed =
        parseFhirInboundClinicLabSyncObservationRequest(rawPayload);
      expect(parsed.universalCode).toBe(expectedUniversalCode);
      expect(parsed.observations[0].universalCode).toBe(
        expectedObservationCode,
      );
    },
  );

  it('requires a Bundle with Patient and Observation resources', () => {
    expect(() =>
      parseFhirInboundClinicLabSyncObservationRequest(
        JSON.stringify({ resourceType: 'Patient' }),
      ),
    ).toThrow('FHIR payload must be a Bundle');
    expect(() =>
      parseFhirInboundClinicLabSyncObservationRequest(
        JSON.stringify({ resourceType: 'Bundle', entry: [] }),
      ),
    ).toThrow('FHIR Bundle requires Patient and at least one Observation');
  });

  it('rejects invalid JSON payloads', () => {
    expect(() =>
      parseFhirInboundClinicLabSyncObservationRequest('not-json'),
    ).toThrow('FHIR payload must be valid JSON');
  });

  it('parses bundles without DiagnosticReport and string observation values', () => {
    const parsed = parseFhirInboundClinicLabSyncObservationRequest(
      JSON.stringify({
        resourceType: 'Bundle',
        entry: [
          {
            resource: {
              resourceType: 'Patient',
              name: [{ given: ['Alex'] }],
            },
          },
          {
            resource: {
              resourceType: 'Observation',
              status: 'final',
              code: { coding: [{ code: 'WBC', display: 'WBC' }] },
              valueString: '11.0',
            },
          },
        ],
      }),
    );

    expect(parsed.universalCode).toBe('WBC');
    expect(parsed.patientFirstName).toBe('Alex');
    expect(parsed.observations[0].resultValue).toBe('11.0');
  });

  it('rejects observations and patients without required coded fields', () => {
    expect(() =>
      parseFhirInboundClinicLabSyncObservationRequest(
        JSON.stringify({
          resourceType: 'Bundle',
          entry: [
            { resource: { resourceType: 'Patient', name: [] } },
            {
              resource: {
                resourceType: 'Observation',
                status: 'final',
                code: { text: 'WBC' },
              },
            },
          ],
        }),
      ),
    ).toThrow('FHIR Patient is missing name');
  });
});
