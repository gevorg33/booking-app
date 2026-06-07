import type {
  ClinicSpecimenStatus,
  ClinicTestOrderStatus,
  ClinicTestResultStatus,
} from './clinic-lab-state.util.js';
import {
  CLINIC_SPECIMEN_STATUSES,
  canTransitionClinicSpecimen,
} from './clinic-lab-state.util.js';

export interface ClinicLabTransitionFixture {
  id: string;
  kind: 'order' | 'result' | 'specimen';
  from: ClinicTestOrderStatus | ClinicTestResultStatus | ClinicSpecimenStatus;
  to: ClinicTestOrderStatus | ClinicTestResultStatus | ClinicSpecimenStatus;
  allowed: boolean;
  v1ShortPath?: boolean;
}

export const CLINIC_LAB_ORDER_TRANSITION_FIXTURES: ClinicLabTransitionFixture[] =
  [
    {
      id: 'order-not-collected-to-collecting',
      kind: 'order',
      from: 'NotCollected',
      to: 'Collecting',
      allowed: true,
    },
    {
      id: 'order-collecting-to-awaiting',
      kind: 'order',
      from: 'Collecting',
      to: 'AwaitingResults',
      allowed: true,
    },
    {
      id: 'order-awaiting-to-completed',
      kind: 'order',
      from: 'AwaitingResults',
      to: 'Completed',
      allowed: true,
    },
    {
      id: 'order-not-collected-to-cancelled',
      kind: 'order',
      from: 'NotCollected',
      to: 'Cancelled',
      allowed: true,
    },
    {
      id: 'order-completed-to-collecting-forbidden',
      kind: 'order',
      from: 'Completed',
      to: 'Collecting',
      allowed: false,
    },
    {
      id: 'order-cancelled-to-not-collected-forbidden',
      kind: 'order',
      from: 'Cancelled',
      to: 'NotCollected',
      allowed: false,
    },
  ];

export const CLINIC_LAB_RESULT_TRANSITION_FIXTURES: ClinicLabTransitionFixture[] =
  [
    {
      id: 'result-not-received-to-pending',
      kind: 'result',
      from: 'NotReceived',
      to: 'Pending',
      allowed: true,
    },
    {
      id: 'result-pending-to-completed',
      kind: 'result',
      from: 'Pending',
      to: 'Completed',
      allowed: true,
    },
    {
      id: 'result-completed-to-reviewed',
      kind: 'result',
      from: 'Completed',
      to: 'Reviewed',
      allowed: true,
    },
    {
      id: 'result-reviewed-to-released',
      kind: 'result',
      from: 'Reviewed',
      to: 'Released',
      allowed: true,
    },
    {
      id: 'result-completed-to-released-direct',
      kind: 'result',
      from: 'Completed',
      to: 'Released',
      allowed: true,
    },
    {
      id: 'result-released-to-completed-forbidden',
      kind: 'result',
      from: 'Released',
      to: 'Completed',
      allowed: false,
    },
    {
      id: 'result-rejected-to-released-forbidden',
      kind: 'result',
      from: 'Rejected',
      to: 'Released',
      allowed: false,
    },
  ];

function buildSpecimenTransitionFixtures(): ClinicLabTransitionFixture[] {
  const fixtures: ClinicLabTransitionFixture[] = [];

  for (const from of CLINIC_SPECIMEN_STATUSES) {
    for (const to of CLINIC_SPECIMEN_STATUSES) {
      if (from === to) continue;
      fixtures.push({
        id: `specimen-${from}-to-${to}`,
        kind: 'specimen',
        from,
        to,
        allowed: canTransitionClinicSpecimen(from, to),
      });
    }
  }

  for (const to of CLINIC_SPECIMEN_STATUSES) {
    if (to === 'Collected') continue;
    const standardAllowed = canTransitionClinicSpecimen('Collected', to);
    const v1Allowed = canTransitionClinicSpecimen('Collected', to, {
      v1ShortPath: true,
    });
    if (standardAllowed === v1Allowed) continue;
    fixtures.push({
      id: `specimen-v1-collected-to-${to}`,
      kind: 'specimen',
      from: 'Collected',
      to,
      allowed: v1Allowed,
      v1ShortPath: true,
    });
  }

  return fixtures;
}

export const CLINIC_LAB_SPECIMEN_TRANSITION_FIXTURES: ClinicLabTransitionFixture[] =
  buildSpecimenTransitionFixtures();

export const CLINIC_LAB_ALLOWED_SPECIMEN_TRANSITION_FIXTURES =
  CLINIC_LAB_SPECIMEN_TRANSITION_FIXTURES.filter((fixture) => fixture.allowed);

export const CLINIC_LAB_BUSINESS_TYPE_GATE_FIXTURES = [
  { id: 'gate-clinic', businessType: 'clinic', enabled: true },
  { id: 'gate-polyclinic', businessType: 'polyclinic', enabled: true },
  { id: 'gate-beauty-clinic', businessType: 'beauty_clinic', enabled: true },
  { id: 'gate-dental', businessType: 'dental', enabled: true },
  { id: 'gate-hair-salon', businessType: 'hair_salon', enabled: false },
  { id: 'gate-tour', businessType: 'tour_operator', enabled: false },
  { id: 'gate-null', businessType: null, enabled: false },
] as const;

export const CLINIC_LAB_ALL_TRANSITION_FIXTURES: ClinicLabTransitionFixture[] =
  [
    ...CLINIC_LAB_ORDER_TRANSITION_FIXTURES,
    ...CLINIC_LAB_RESULT_TRANSITION_FIXTURES,
    ...CLINIC_LAB_SPECIMEN_TRANSITION_FIXTURES,
  ];
