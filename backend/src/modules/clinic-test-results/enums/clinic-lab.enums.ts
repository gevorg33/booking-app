import {
  CLINIC_PATIENT_RESULT_VISIBILITY,
  CLINIC_RESULT_MEASUREMENT_FLAGS,
  CLINIC_SPECIMEN_STATUSES,
  CLINIC_TEST_ORDER_STATUSES,
  CLINIC_TEST_RESULT_STATUSES,
  type ClinicPatientResultVisibility,
  type ClinicResultMeasurementFlag,
  type ClinicSpecimenStatus,
  type ClinicTestOrderStatus,
  type ClinicTestResultStatus,
} from '../../../common/utils/clinic-lab-state.util.js';

export {
  CLINIC_PATIENT_RESULT_VISIBILITY,
  CLINIC_RESULT_MEASUREMENT_FLAGS,
  CLINIC_SPECIMEN_STATUSES,
  CLINIC_TEST_ORDER_STATUSES,
  CLINIC_TEST_RESULT_STATUSES,
};

export type {
  ClinicPatientResultVisibility,
  ClinicResultMeasurementFlag,
  ClinicSpecimenStatus,
  ClinicTestOrderStatus,
  ClinicTestResultStatus,
};

export const CLINIC_TEST_ORDER_ITEM_TYPES = [
  'test_type',
  'test_panel',
] as const;
export type ClinicTestOrderItemType =
  (typeof CLINIC_TEST_ORDER_ITEM_TYPES)[number];

export const CLINIC_TEST_RESULT_KINDS = ['test_type', 'test_panel'] as const;
export type ClinicTestResultKind = (typeof CLINIC_TEST_RESULT_KINDS)[number];

export const CLINIC_TRANSPORT_FOLDER_STATUSES = [
  'Open',
  'InTransit',
  'Received',
  'Closed',
] as const;
export type ClinicTransportFolderStatus =
  (typeof CLINIC_TRANSPORT_FOLDER_STATUSES)[number];
