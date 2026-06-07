import { MemberRole } from '../business/entities/business-member.entity.js';

export const CLINIC_LAB_INFO_FIXTURES = [
  {
    id: 'lab-info-1',
    businessId: 'biz-1',
    name: 'In-house hematology',
    location: 'Building A, floor 2',
    phone: '+15551234567',
    labLocation: 'InHouse' as const,
    labType: 'Internal' as const,
    integrationVendorCode: null,
    isActive: true,
  },
  {
    id: 'lab-info-2',
    businessId: 'biz-1',
    name: 'Regional reference lab',
    location: '123 Main Street',
    phone: '+15557654321',
    labLocation: 'External' as const,
    labType: null,
    integrationVendorCode: 'GENERIC-LIS',
    isActive: true,
  },
] as const;

export const CLINIC_LAB_MACHINE_FIXTURES = [
  {
    id: 'lab-machine-1',
    businessId: 'biz-1',
    labInfoId: 'lab-info-1',
    name: 'Analyzer A',
    isActive: true,
    labInfo: { name: 'In-house hematology' },
  },
  {
    id: 'lab-machine-2',
    businessId: 'biz-1',
    labInfoId: null,
    name: 'Backup centrifuge',
    isActive: true,
    labInfo: null,
  },
] as const;

export const CLINIC_LAB_INFO_CREATE_PAYLOADS = [
  {
    id: 'internal-lab',
    dto: {
      name: 'In-house core lab',
      location: 'Wing B',
      phone: '+15550001111',
      labLocation: 'InHouse' as const,
      labType: 'Internal' as const,
    },
  },
  {
    id: 'external-lab',
    dto: {
      name: 'Partner reference lab',
      location: 'Remote site',
      phone: '+15550002222',
      labLocation: 'External' as const,
      integrationVendorCode: 'GENERIC-LIS',
    },
  },
] as const;

export const CLINIC_LAB_SYNC_INGEST_PAYLOADS = [
  {
    id: 'cbc-unlinked',
    dto: {
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
  },
] as const;

export const CLINIC_LAB_REGISTRY_ACCESS_SCENARIOS = [
  { id: 'manager', role: MemberRole.MANAGER, canManage: true },
  { id: 'staff', role: MemberRole.STAFF, canManage: false },
] as const;

export const CLINIC_LAB_SYNC_ADAPTER_FIXTURE = {
  request: {
    testName: 'Lipid panel',
    universalCode: 'LIPID',
    patientFirstName: 'Alex',
    patientLastName: 'Kim',
    systemReceivedOn: '2026-06-07T11:00:00.000Z',
    observations: [
      {
        testName: 'LDL',
        universalCode: 'LDL',
        resultValue: '130',
        abnormalFlags: 'HIGH',
      },
    ],
  },
} as const;
