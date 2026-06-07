import {
  assertAllowedClinicTaskType,
  canTransitionClinicTaskStatus,
  defaultClinicTaskTitle,
  isAllowedClinicTaskType,
  isClinicTaskOpen,
  isClinicTaskPriority,
  isClinicTaskStatus,
  isForbiddenIvfClinicTaskType,
  normalizeClinicTaskNotes,
  validateClinicTaskLinks,
} from './clinic-task.util.js';
import type { ClinicTaskType } from './clinic-task.types.js';
import {
  CLINIC_TASK_TYPES,
  FORBIDDEN_IVF_CLINIC_TASK_TYPES,
} from './clinic-task.types.js';
import {
  CLINIC_TASK_LINK_VALIDATION_SCENARIOS,
  CLINIC_TASK_STATUS_TRANSITION_SCENARIOS,
  FORBIDDEN_IVF_TASK_TYPE_SCENARIOS,
} from '../../modules/clinic-tasks/clinic-task.fixtures.js';

describe('clinic-task.util', () => {
  it.each(CLINIC_TASK_TYPES.map((taskType) => ({ taskType })))(
    'accepts generic clinic task type $taskType',
    ({ taskType }) => {
      expect(isAllowedClinicTaskType(taskType)).toBe(true);
      expect(assertAllowedClinicTaskType(taskType)).toBe(taskType);
    },
  );

  it.each(FORBIDDEN_IVF_TASK_TYPE_SCENARIOS)(
    'rejects IVF automated task type $id',
    ({ taskType }) => {
      expect(isForbiddenIvfClinicTaskType(taskType)).toBe(true);
      expect(isAllowedClinicTaskType(taskType)).toBe(false);
      expect(() => assertAllowedClinicTaskType(taskType)).toThrow(
        'IVF automated task types are not supported',
      );
    },
  );

  it('keeps forbidden IVF automated task types out of the supported enum', () => {
    for (const forbidden of FORBIDDEN_IVF_CLINIC_TASK_TYPES) {
      expect(CLINIC_TASK_TYPES).not.toContain(forbidden);
    }
  });

  it.each(CLINIC_TASK_LINK_VALIDATION_SCENARIOS)(
    'validates required links for $id',
    ({ taskType, links, expectedError }) => {
      expect(validateClinicTaskLinks(taskType, links)).toBe(expectedError);
    },
  );

  it.each(CLINIC_TASK_STATUS_TRANSITION_SCENARIOS)(
    'status transition $id is allowed=$allowed',
    ({ from, to, allowed }) => {
      expect(canTransitionClinicTaskStatus(from, to)).toBe(allowed);
    },
  );

  it('maps default titles for each generic task type', () => {
    expect(defaultClinicTaskTitle('ResultReview')).toBe('Review lab result');
    expect(defaultClinicTaskTitle('SpecimenCollection')).toBe(
      'Collect specimen',
    );
    expect(defaultClinicTaskTitle('PatientCallback')).toBe('Patient callback');
  });

  it('rejects unsupported non-IVF task types', () => {
    expect(() => assertAllowedClinicTaskType('FollowUp')).toThrow(
      'Unsupported clinic task type',
    );
  });

  it('detects supported status and priority values', () => {
    expect(isClinicTaskStatus('open')).toBe(true);
    expect(isClinicTaskStatus('bogus')).toBe(false);
    expect(isClinicTaskPriority('high')).toBe(true);
    expect(isClinicTaskPriority('urgent')).toBe(false);
    expect(isClinicTaskOpen('in_progress')).toBe(true);
    expect(isClinicTaskOpen('completed')).toBe(false);
  });

  it('falls back for unknown task type helpers', () => {
    const unknownType = 'Unknown' as ClinicTaskType;
    expect(canTransitionClinicTaskStatus('open', 'bogus' as never)).toBe(false);
    expect(validateClinicTaskLinks(unknownType, {})).toBe(
      'Unsupported clinic task type',
    );
    expect(defaultClinicTaskTitle(unknownType)).toBe('Clinic task');
  });
});
