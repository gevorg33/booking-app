import type { InboundClinicLabSyncObservationRequestPayload } from './clinic-lab-sync-observation.adapter.util.js';

interface FhirCoding {
  code?: string;
  display?: string;
}

interface FhirCodeableConcept {
  coding?: FhirCoding[];
  text?: string;
}

interface FhirHumanName {
  given?: string[];
  family?: string;
}

interface FhirQuantity {
  value?: number | string;
  unit?: string;
}

interface FhirReferenceRange {
  text?: string;
}

interface FhirResource {
  resourceType: string;
  id?: string;
  name?: FhirHumanName[];
  birthDate?: string;
  gender?: string;
  identifier?: Array<{ value?: string }>;
  code?: FhirCodeableConcept;
  subject?: { reference?: string };
  effectiveDateTime?: string;
  issued?: string;
  status?: string;
  valueQuantity?: FhirQuantity;
  valueString?: string;
  referenceRange?: FhirReferenceRange[];
  interpretation?: FhirCodeableConcept[];
}

interface FhirBundle {
  resourceType: string;
  entry?: Array<{ resource?: FhirResource }>;
}

function readCode(concept: FhirCodeableConcept | undefined): {
  code: string;
  name: string;
} {
  const coding = concept?.coding?.[0];
  const code = coding?.code?.trim() ?? '';
  const name = coding?.display?.trim() || concept?.text?.trim() || code;
  if (!code) throw new Error('FHIR resource is missing coded identifier');
  return { code, name };
}

function readObservationValue(resource: FhirResource): string {
  if (resource.valueString != null && String(resource.valueString).trim()) {
    return String(resource.valueString).trim();
  }
  if (resource.valueQuantity?.value != null) {
    return String(resource.valueQuantity.value);
  }
  throw new Error('FHIR Observation is missing result value');
}

function readPatientName(resource: FhirResource): {
  firstName: string;
  lastName: string;
  middleName: string | null;
} {
  const name = resource.name?.[0];
  const firstName = name?.given?.[0]?.trim() ?? '';
  const middleName = name?.given?.[1]?.trim() || null;
  const lastName = name?.family?.trim() ?? '';
  if (!firstName && !lastName) {
    throw new Error('FHIR Patient is missing name');
  }
  return {
    firstName: firstName || lastName,
    middleName,
    lastName: lastName || firstName,
  };
}

export function parseFhirInboundClinicLabSyncObservationRequest(
  rawPayload: string,
): InboundClinicLabSyncObservationRequestPayload {
  let parsed: FhirBundle;
  try {
    parsed = JSON.parse(rawPayload) as FhirBundle;
  } catch {
    throw new Error('FHIR payload must be valid JSON');
  }
  if (parsed.resourceType !== 'Bundle') {
    throw new Error('FHIR payload must be a Bundle');
  }

  const resources = (parsed.entry ?? [])
    .map((entry) => entry.resource)
    .filter((resource): resource is FhirResource => Boolean(resource));

  const patient = resources.find(
    (resource) => resource.resourceType === 'Patient',
  );
  const report = resources.find(
    (resource) => resource.resourceType === 'DiagnosticReport',
  );
  const observations = resources.filter(
    (resource) => resource.resourceType === 'Observation',
  );

  if (!patient || observations.length === 0) {
    throw new Error(
      'FHIR Bundle requires Patient and at least one Observation',
    );
  }

  const patientName = readPatientName(patient);
  const reportCode = report
    ? readCode(report.code)
    : readCode(observations[0].code);
  const systemReceivedOn =
    report?.issued ?? observations[0].issued ?? new Date().toISOString();

  return {
    testName: reportCode.name,
    universalCode: reportCode.code,
    patientFirstName: patientName.firstName,
    patientMiddleName: patientName.middleName,
    patientLastName: patientName.lastName,
    patientDateOfBirth: patient.birthDate ?? undefined,
    patientExternalId: patient.identifier?.[0]?.value ?? undefined,
    patientSexAtBirth: patient.gender ?? undefined,
    systemReceivedOn,
    observationDate:
      report?.effectiveDateTime ??
      observations[0].effectiveDateTime ??
      undefined,
    vendorResultStatus: report?.status ?? observations[0].status ?? undefined,
    observations: observations.map((resource) => {
      const code = readCode(resource.code);
      return {
        testName: code.name,
        universalCode: code.code,
        resultValue: readObservationValue(resource),
        unit: resource.valueQuantity?.unit ?? undefined,
        referenceRange: resource.referenceRange?.[0]?.text ?? undefined,
        abnormalFlags:
          resource.interpretation?.[0]?.coding?.[0]?.code ?? undefined,
        vendorResultStatus: resource.status ?? undefined,
        observationDate: resource.effectiveDateTime ?? undefined,
      };
    }),
  };
}
