import type {
  ClinicLabInfoSummary,
  ClinicLabMachineSummary,
  ClinicLabSyncObservationRequestView,
  ClinicLabSyncObservationResultView,
} from '../../common/utils/clinic-lis.types.js';
import type { ClinicLabInfo } from './entities/clinic-lab-info.entity.js';
import type { ClinicLabMachine } from './entities/clinic-lab-machine.entity.js';
import type { ClinicLabSyncObservationRequest } from './entities/clinic-lab-sync-observation-request.entity.js';
import type { ClinicLabSyncObservationResult } from './entities/clinic-lab-sync-observation-result.entity.js';

export function mapClinicLabInfoSummary(
  lab: ClinicLabInfo,
): ClinicLabInfoSummary {
  return {
    id: lab.id,
    name: lab.name,
    location: lab.location,
    phone: lab.phone,
    labLocation: lab.labLocation,
    labType: lab.labType ?? null,
    integrationVendorCode: lab.integrationVendorCode ?? null,
    isActive: lab.isActive,
  };
}

export function mapClinicLabMachineSummary(
  machine: ClinicLabMachine,
  labInfoName?: string | null,
): ClinicLabMachineSummary {
  return {
    id: machine.id,
    name: machine.name,
    labInfoId: machine.labInfoId ?? null,
    labInfoName: labInfoName ?? machine.labInfo?.name ?? null,
    isActive: machine.isActive,
  };
}

export function mapClinicLabSyncObservationResultView(
  observation: ClinicLabSyncObservationResult,
): ClinicLabSyncObservationResultView {
  return {
    id: observation.id,
    testName: observation.testName,
    universalCode: observation.universalCode,
    resultValue: observation.resultValue,
    labComment: observation.labComment ?? null,
    unit: observation.unit ?? null,
    referenceRange: observation.referenceRange ?? null,
    abnormalFlags: observation.abnormalFlags ?? null,
    clinicTestResultMeasurementId:
      observation.clinicTestResultMeasurementId ?? null,
  };
}

export function mapClinicLabSyncObservationRequestView(
  request: ClinicLabSyncObservationRequest,
): ClinicLabSyncObservationRequestView {
  return {
    id: request.id,
    status: request.status,
    testName: request.testName,
    universalCode: request.universalCode,
    patientFirstName: request.patientFirstName,
    patientLastName: request.patientLastName,
    patientDateOfBirth: request.patientDateOfBirth
      ? request.patientDateOfBirth.toISOString().slice(0, 10)
      : null,
    patientExternalId: request.patientExternalId ?? null,
    systemReceivedOn: request.systemReceivedOn.toISOString(),
    integrationVendorCode: request.integrationVendorCode ?? null,
    clinicTestResultId: request.clinicTestResultId ?? null,
    linkMethod: request.linkMethod ?? null,
    observations: (request.observations ?? []).map(
      mapClinicLabSyncObservationResultView,
    ),
  };
}

export function mapClinicLabInfoListItem(lab: ClinicLabInfo): {
  id: string;
  title: string;
} {
  return { id: lab.id, title: lab.name };
}

export function mapClinicLabMachineListItem(machine: ClinicLabMachine): {
  id: string;
  title: string;
} {
  return { id: machine.id, title: machine.name };
}
