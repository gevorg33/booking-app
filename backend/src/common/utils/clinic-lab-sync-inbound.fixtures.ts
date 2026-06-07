export const CLINIC_LIS_INBOUND_WEBHOOK_SECRET =
  'whsec_clinic_lis_inbound_test';

export const CLINIC_LIS_INBOUND_HL7_PAYLOAD = [
  'MSH|^~\\&|LIS|LAB|EMR|CLINIC|20260607100000||ORU^R01|MSG1|P|2.5',
  'PID|1||MRN-1001||Doe^Jane||19900101|F',
  'OBR|1||PL123|CBC^Complete blood count|||20260607100000',
  'OBX|1|NM|WBC^WBC||12.5|10^9/L|4.0-11.0|H|||F',
].join('\r');

export const CLINIC_LIS_INBOUND_FHIR_PAYLOAD = {
  resourceType: 'Bundle',
  type: 'collection',
  entry: [
    {
      resource: {
        resourceType: 'Patient',
        id: 'patient-1',
        identifier: [{ value: 'MRN-1001' }],
        name: [{ family: 'Doe', given: ['Jane'] }],
        birthDate: '1990-01-01',
        gender: 'female',
      },
    },
    {
      resource: {
        resourceType: 'DiagnosticReport',
        id: 'report-1',
        status: 'final',
        code: {
          coding: [{ code: 'CBC', display: 'Complete blood count' }],
        },
        issued: '2026-06-07T10:00:00.000Z',
        effectiveDateTime: '2026-06-07T10:00:00.000Z',
      },
    },
    {
      resource: {
        resourceType: 'Observation',
        id: 'obs-1',
        status: 'final',
        code: { coding: [{ code: 'WBC', display: 'WBC' }] },
        effectiveDateTime: '2026-06-07T10:00:00.000Z',
        valueQuantity: { value: 12.5, unit: '10^9/L' },
        referenceRange: [{ text: '4.0-11.0' }],
        interpretation: [{ coding: [{ code: 'H' }] }],
      },
    },
  ],
} as const;

export const CLINIC_LIS_INBOUND_VENDOR_JSON_PAYLOAD = {
  observationRequest: {
    testName: 'Complete blood count',
    universalCode: 'CBC',
    patientFirstName: 'Jane',
    patientLastName: 'Doe',
    patientExternalId: 'MRN-1001',
    systemReceivedOn: '2026-06-07T10:00:00.000Z',
    integrationVendorCode: 'GENERIC-LIS',
    observations: [
      {
        testName: 'WBC',
        universalCode: 'WBC',
        resultValue: '12.5',
        unit: '10^9/L',
        abnormalFlags: 'H',
      },
    ],
  },
} as const;

export const CLINIC_LIS_INBOUND_PARSE_SCENARIOS = [
  {
    id: 'hl7-oru',
    source: 'hl7' as const,
    contentType: 'application/hl7-v2',
    rawPayload: CLINIC_LIS_INBOUND_HL7_PAYLOAD,
    expectedUniversalCode: 'CBC',
    expectedObservationCode: 'WBC',
  },
  {
    id: 'fhir-bundle',
    source: 'fhir' as const,
    contentType: 'application/fhir+json',
    rawPayload: JSON.stringify(CLINIC_LIS_INBOUND_FHIR_PAYLOAD),
    expectedUniversalCode: 'CBC',
    expectedObservationCode: 'WBC',
  },
  {
    id: 'vendor-json',
    source: 'vendor_json' as const,
    contentType: 'application/json',
    rawPayload: JSON.stringify(CLINIC_LIS_INBOUND_VENDOR_JSON_PAYLOAD),
    expectedUniversalCode: 'CBC',
    expectedObservationCode: 'WBC',
  },
] as const;

export const CLINIC_LIS_INBOUND_RESOLVE_SCENARIOS = [
  {
    id: 'content-type-hl7',
    contentType: 'application/hl7-v2',
    rawPayload: CLINIC_LIS_INBOUND_HL7_PAYLOAD,
    expectedSource: 'hl7' as const,
  },
  {
    id: 'content-type-fhir',
    contentType: 'application/fhir+json',
    rawPayload: JSON.stringify(CLINIC_LIS_INBOUND_FHIR_PAYLOAD),
    expectedSource: 'fhir' as const,
  },
  {
    id: 'json-bundle-detect',
    contentType: 'application/json',
    rawPayload: JSON.stringify(CLINIC_LIS_INBOUND_FHIR_PAYLOAD),
    expectedSource: 'fhir' as const,
  },
  {
    id: 'plain-text-hl7',
    contentType: 'text/plain',
    rawPayload: CLINIC_LIS_INBOUND_HL7_PAYLOAD,
    expectedSource: 'hl7' as const,
  },
] as const;
