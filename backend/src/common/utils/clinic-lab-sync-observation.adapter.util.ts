import type {
  ClinicLabSyncLinkMethod,
  ClinicLabSyncObservationStatus,
} from './clinic-lis.types.js';
import {
  CLINIC_LAB_SYNC_LINK_METHODS,
  CLINIC_LAB_SYNC_OBSERVATION_STATUSES,
} from './clinic-lis.types.js';
import { assertAllowedClinicLabIntegrationVendorCode } from './clinic-lab-info.util.js';

export interface InboundClinicLabSyncObservationResultPayload {
  testName: string;
  universalCode: string;
  resultValue: string;
  labComment?: string | null;
  vendorResultStatus?: string | null;
  observationDate?: string | null;
  producerId?: string | null;
  producerText?: string | null;
  unit?: string | null;
  referenceRange?: string | null;
  abnormalFlags?: string | null;
  revisionId?: string | null;
}

export interface InboundClinicLabSyncObservationRequestPayload {
  testName: string;
  universalCode: string;
  patientFirstName: string;
  patientMiddleName?: string | null;
  patientLastName: string;
  patientDateOfBirth?: string | null;
  patientExternalId?: string | null;
  patientAddress?: string | null;
  patientPostalCode?: string | null;
  patientPhone?: string | null;
  patientSexAtBirth?: string | null;
  systemReceivedOn: string;
  specimenReceivedOn?: string | null;
  observationDate?: string | null;
  placerOrderNumber?: string | null;
  orderingProvider?: string | null;
  fillerOrderNumber?: string | null;
  diagnosticServiceSectionId?: string | null;
  vendorResultStatus?: string | null;
  department?: string | null;
  revisionId?: string | null;
  integrationVendorCode?: string | null;
  labInfoId?: string | null;
  observations: InboundClinicLabSyncObservationResultPayload[];
}

export interface AdaptedClinicLabSyncObservationResult {
  testName: string;
  universalCode: string;
  resultValue: string;
  labComment: string | null;
  vendorResultStatus: string | null;
  observationDate: Date | null;
  producerId: string | null;
  producerText: string | null;
  unit: string | null;
  referenceRange: string | null;
  abnormalFlags: string | null;
  revisionId: string | null;
}

export interface AdaptedClinicLabSyncObservationRequest {
  labInfoId: string | null;
  testName: string;
  universalCode: string;
  patientFirstName: string;
  patientMiddleName: string | null;
  patientLastName: string;
  patientDateOfBirth: Date | null;
  patientExternalId: string | null;
  patientAddress: string | null;
  patientPostalCode: string | null;
  patientPhone: string | null;
  patientSexAtBirth: string | null;
  systemReceivedOn: Date;
  specimenReceivedOn: Date | null;
  observationDate: Date | null;
  placerOrderNumber: string | null;
  orderingProvider: string | null;
  fillerOrderNumber: string | null;
  diagnosticServiceSectionId: string | null;
  vendorResultStatus: string | null;
  department: string | null;
  revisionId: string | null;
  integrationVendorCode: string | null;
  status: ClinicLabSyncObservationStatus;
  observations: AdaptedClinicLabSyncObservationResult[];
}

function normalizeText(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseOptionalDate(value: string | null | undefined): Date | null {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseRequiredDate(value: string): Date {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Invalid systemReceivedOn timestamp');
  }
  return parsed;
}

function normalizeUniversalCode(value: string): string {
  return value.trim().toUpperCase();
}

export function isClinicLabSyncObservationStatus(
  value: unknown,
): value is ClinicLabSyncObservationStatus {
  return (
    typeof value === 'string' &&
    (CLINIC_LAB_SYNC_OBSERVATION_STATUSES as readonly string[]).includes(value)
  );
}

export function isClinicLabSyncLinkMethod(
  value: unknown,
): value is ClinicLabSyncLinkMethod {
  return (
    typeof value === 'string' &&
    (CLINIC_LAB_SYNC_LINK_METHODS as readonly string[]).includes(value)
  );
}

export function adaptInboundClinicLabSyncObservationResult(
  payload: InboundClinicLabSyncObservationResultPayload,
): AdaptedClinicLabSyncObservationResult {
  const testName = normalizeText(payload.testName);
  const universalCode = normalizeText(payload.universalCode);
  const resultValue = normalizeText(payload.resultValue);
  if (!testName || !universalCode || resultValue == null) {
    throw new Error(
      'Observation result requires testName, universalCode, and resultValue',
    );
  }

  return {
    testName,
    universalCode: normalizeUniversalCode(universalCode),
    resultValue,
    labComment: normalizeText(payload.labComment),
    vendorResultStatus: normalizeText(payload.vendorResultStatus),
    observationDate: parseOptionalDate(payload.observationDate),
    producerId: normalizeText(payload.producerId),
    producerText: normalizeText(payload.producerText),
    unit: normalizeText(payload.unit),
    referenceRange: normalizeText(payload.referenceRange),
    abnormalFlags: normalizeText(payload.abnormalFlags),
    revisionId: normalizeText(payload.revisionId),
  };
}

export function adaptInboundClinicLabSyncObservationRequest(
  payload: InboundClinicLabSyncObservationRequestPayload,
): AdaptedClinicLabSyncObservationRequest {
  const testName = normalizeText(payload.testName);
  const universalCode = normalizeText(payload.universalCode);
  const patientFirstName = normalizeText(payload.patientFirstName);
  const patientLastName = normalizeText(payload.patientLastName);
  if (!testName || !universalCode || !patientFirstName || !patientLastName) {
    throw new Error(
      'Observation request requires testName, universalCode, patientFirstName, and patientLastName',
    );
  }
  if (
    !Array.isArray(payload.observations) ||
    payload.observations.length === 0
  ) {
    throw new Error(
      'Observation request requires at least one observation result',
    );
  }

  return {
    labInfoId: normalizeText(payload.labInfoId),
    testName,
    universalCode: normalizeUniversalCode(universalCode),
    patientFirstName,
    patientMiddleName: normalizeText(payload.patientMiddleName),
    patientLastName,
    patientDateOfBirth: parseOptionalDate(payload.patientDateOfBirth),
    patientExternalId: normalizeText(payload.patientExternalId),
    patientAddress: normalizeText(payload.patientAddress),
    patientPostalCode: normalizeText(payload.patientPostalCode),
    patientPhone: normalizeText(payload.patientPhone),
    patientSexAtBirth: normalizeText(payload.patientSexAtBirth),
    systemReceivedOn: parseRequiredDate(payload.systemReceivedOn),
    specimenReceivedOn: parseOptionalDate(payload.specimenReceivedOn),
    observationDate: parseOptionalDate(payload.observationDate),
    placerOrderNumber: normalizeText(payload.placerOrderNumber),
    orderingProvider: normalizeText(payload.orderingProvider),
    fillerOrderNumber: normalizeText(payload.fillerOrderNumber),
    diagnosticServiceSectionId: normalizeText(
      payload.diagnosticServiceSectionId,
    ),
    vendorResultStatus: normalizeText(payload.vendorResultStatus),
    department: normalizeText(payload.department),
    revisionId: normalizeText(payload.revisionId),
    integrationVendorCode: assertAllowedClinicLabIntegrationVendorCode(
      payload.integrationVendorCode,
    ),
    status: 'Unlinked',
    observations: payload.observations.map(
      adaptInboundClinicLabSyncObservationResult,
    ),
  };
}

export function mapAbnormalFlagToMeasurementFlag(
  abnormalFlags: string | null | undefined,
): string | null {
  const normalized = normalizeText(abnormalFlags)?.toUpperCase() ?? '';
  if (!normalized) return null;
  if (normalized.includes('H') || normalized.includes('HIGH')) return 'High';
  if (normalized.includes('L') || normalized.includes('LOW')) return 'Low';
  if (normalized.includes('A') || normalized.includes('ABN')) return 'Abnormal';
  return null;
}

export function matchObservationToMeasurementByCode(input: {
  observationUniversalCode: string;
  measurementTestTypeCode: string;
}): boolean {
  return (
    normalizeUniversalCode(input.observationUniversalCode) ===
    normalizeUniversalCode(input.measurementTestTypeCode)
  );
}
