import { describe, expect, it } from 'vitest';
import {
  formatClinicMeasurementFlagLabel,
  formatClinicResultStatusLabel,
  getClinicMeasurementFlagChipClass,
  getClinicResultStatusChipClass,
} from './clinic-lab-state.js';

const RESULT_STATUSES = [
  ['NotReceived', 'Not received', 'Չի ստացվել', 'Не получен'],
  ['Pending', 'Pending', 'Սպասման մեջ', 'В ожидании'],
  ['WaitingCompletion', 'Waiting completion', 'Սպասում է ավարտին', 'Ожидание завершения'],
  ['Completed', 'Completed', 'Ավարտված', 'Завершён'],
  ['Reviewed', 'Reviewed', 'Վերանայված', 'Проверен'],
  ['AutomaticallyReviewed', 'Automatically reviewed', 'Ավտոմատ վերանայված', 'Проверен автоматически'],
  ['Released', 'Released', 'Հրապարակված', 'Опубликован'],
  ['Rejected', 'Rejected', 'Մերժված', 'Отклонён'],
] as const;

describe('clinic-lab-state', () => {
  it.each(RESULT_STATUSES)(
    'formats result status %s in en, hy, and ru',
    (status, en, hy, ru) => {
      expect(formatClinicResultStatusLabel(status)).toBe(en);
      expect(formatClinicResultStatusLabel(status, 'hy')).toBe(hy);
      expect(formatClinicResultStatusLabel(status, 'ru')).toBe(ru);
    },
  );

  it('formats measurement labels and falls back for unknown flags', () => {
    expect(formatClinicMeasurementFlagLabel('Normal')).toBe('Normal');
    expect(formatClinicMeasurementFlagLabel('Normal', 'ru')).toBe('Норма');
    expect(formatClinicMeasurementFlagLabel('Unknown')).toBe('Unknown');
  });

  it('returns chip classes by tone', () => {
    expect(getClinicResultStatusChipClass('Released')).toContain('success');
    expect(getClinicResultStatusChipClass('Reviewed')).toContain('neutral');
    expect(getClinicMeasurementFlagChipClass('Abnormal')).toContain('danger');
    expect(getClinicMeasurementFlagChipClass('SeeDetails')).toContain('info');
    expect(getClinicMeasurementFlagChipClass('Unknown')).toContain('neutral');
  });
});
