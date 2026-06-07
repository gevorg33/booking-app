import type { InboundClinicLabSyncObservationRequestPayload } from './clinic-lab-sync-observation.adapter.util.js';

function splitHl7Segments(rawPayload: string): string[] {
  return rawPayload
    .split(/\r\n|\r|\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function splitHl7Field(field: string | undefined): {
  code: string;
  name: string;
} {
  if (!field) return { code: '', name: '' };
  const parts = field.split('^');
  const code = parts[0]?.trim() ?? '';
  const name = parts[1]?.trim() || code;
  return { code, name };
}

function parseHl7Date(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  const digits = value.replace(/\D/g, '');
  if (digits.length >= 14) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}T${digits.slice(8, 10)}:${digits.slice(10, 12)}:${digits.slice(12, 14)}.000Z`;
  }
  if (digits.length >= 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}T00:00:00.000Z`;
  }
  return null;
}

function parsePatientName(field: string | undefined): {
  firstName: string;
  middleName: string | null;
  lastName: string;
} {
  if (!field?.trim()) {
    throw new Error('HL7 PID segment is missing patient name');
  }
  const parts = field.split('^');
  const lastName = parts[0]?.trim() ?? '';
  const firstName = parts[1]?.trim() ?? '';
  const middleName = parts[2]?.trim() || null;
  if (!firstName && !lastName) {
    throw new Error('HL7 PID segment has an empty patient name');
  }
  return {
    firstName: firstName || lastName,
    middleName,
    lastName: lastName || firstName,
  };
}

function readHl7Field(segment: string, index: number): string | undefined {
  const fields = segment.split('|');
  return fields[index];
}

export function parseHl7InboundClinicLabSyncObservationRequest(
  rawPayload: string,
): InboundClinicLabSyncObservationRequestPayload {
  const segments = splitHl7Segments(rawPayload);
  const pid = segments.find((segment) => segment.startsWith('PID|'));
  const obr = segments.find((segment) => segment.startsWith('OBR|'));
  const obxSegments = segments.filter((segment) => segment.startsWith('OBX|'));
  const msh = segments.find((segment) => segment.startsWith('MSH|'));

  if (!pid || !obr || obxSegments.length === 0) {
    throw new Error(
      'HL7 ORU payload requires PID, OBR, and at least one OBX segment',
    );
  }

  const patientName = parsePatientName(readHl7Field(pid, 5));
  const service = splitHl7Field(readHl7Field(obr, 4));
  const systemReceivedOn =
    parseHl7Date(msh ? (readHl7Field(msh, 7) ?? '') : '') ??
    parseHl7Date(readHl7Field(obr, 7)) ??
    new Date().toISOString();

  const observations = obxSegments.map((segment) => {
    const identifier = splitHl7Field(readHl7Field(segment, 3));
    const resultValue = readHl7Field(segment, 5)?.trim() ?? '';
    if (!identifier.code || !resultValue) {
      throw new Error('HL7 OBX segment requires identifier and result value');
    }
    return {
      testName: identifier.name || identifier.code,
      universalCode: identifier.code,
      resultValue,
      unit: readHl7Field(segment, 6)?.trim() || undefined,
      referenceRange: readHl7Field(segment, 7)?.trim() || undefined,
      abnormalFlags: readHl7Field(segment, 8)?.trim() || undefined,
      vendorResultStatus: readHl7Field(segment, 11)?.trim() || undefined,
      observationDate: parseHl7Date(readHl7Field(segment, 14)) ?? undefined,
    };
  });

  return {
    testName: service.name || service.code,
    universalCode: service.code,
    patientFirstName: patientName.firstName,
    patientMiddleName: patientName.middleName,
    patientLastName: patientName.lastName,
    patientDateOfBirth: parseHl7Date(readHl7Field(pid, 7)) ?? undefined,
    patientExternalId: readHl7Field(pid, 3)?.split('^')[0]?.trim() || undefined,
    patientSexAtBirth: readHl7Field(pid, 8)?.trim() || undefined,
    systemReceivedOn,
    observationDate: parseHl7Date(readHl7Field(obr, 7)) ?? undefined,
    placerOrderNumber: readHl7Field(obr, 2)?.trim() || undefined,
    fillerOrderNumber: readHl7Field(obr, 3)?.trim() || undefined,
    orderingProvider: readHl7Field(obr, 16)?.trim() || undefined,
    vendorResultStatus: readHl7Field(obr, 25)?.trim() || undefined,
    observations,
  };
}
