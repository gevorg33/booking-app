import {
  applyScheduleOpsPromptHints,
  disambiguateClearScheduleVsHideCalendar,
  inheritScheduleFollowUpContext,
  isFillGapsFollowUpPrompt,
  isHideAppointmentsFromCalendarPrompt,
} from './ai-schedule-ops-hints.util.js';

describe('ai-schedule-ops-hints.util', () => {
  const employees = [
    { id: 'e1', name: 'Gevorg Gasparyan' },
    { id: 'e2', name: 'Mary Torgomyan' },
  ];

  describe('clear_schedule vs hide_appointments_from_calendar', () => {
    it('detects hide-from-calendar prompts', () => {
      expect(
        isHideAppointmentsFromCalendarPrompt(
          'Hide cancelled appointments from Gevorg calendar today',
        ),
      ).toBe(true);
      expect(
        isHideAppointmentsFromCalendarPrompt(
          'Remove all bookings from the calendar for Mary',
        ),
      ).toBe(true);
    });

    it('does not treat applied-schedule cleanup as hide', () => {
      expect(
        isHideAppointmentsFromCalendarPrompt(
          'Clear Gevorg schedule for tomorrow',
        ),
      ).toBe(false);
    });

    it('flips misclassified clear_schedule to hide', () => {
      const result = disambiguateClearScheduleVsHideCalendar(
        'Hide done appointments from calendar this week',
        'clear_schedule',
      );
      expect(result?.action).toBe('hide_appointments_from_calendar');
      expect(result?.rescueReason).toBe('clear_to_hide_calendar');
    });

    it('flips misclassified hide to clear_schedule', () => {
      const result = disambiguateClearScheduleVsHideCalendar(
        'Clear Gevorg schedule for this week',
        'hide_appointments_from_calendar',
      );
      expect(result?.action).toBe('clear_schedule');
      expect(result?.rescueReason).toBe('hide_to_clear_schedule');
    });

    it('rescues read-only mislabels to clear_schedule', () => {
      const result = disambiguateClearScheduleVsHideCalendar(
        'Wipe Karo schedule Friday',
        'list_schedule_gaps',
      );
      expect(result?.action).toBe('clear_schedule');
      expect(result?.rescueReason).toBe('read_to_clear_schedule');
    });
  });

  describe('fill-gaps follow-ups', () => {
    it('detects fill those gaps phrasing', () => {
      expect(isFillGapsFollowUpPrompt('fill those gaps')).toBe(true);
      expect(isFillGapsFollowUpPrompt('fill them with his services')).toBe(
        true,
      );
    });

    it('inherits session context for fill_unused_slots follow-up', () => {
      const params: Record<string, any> = {};
      inheritScheduleFollowUpContext(
        params,
        {
          lastAction: 'list_schedule_gaps',
          employeeName: 'Gevorg Gasparyan',
          dateFrom: '02/06/2026',
          dateTo: '08/06/2026',
          timeFrom: '09:00',
          timeTo: '17:00',
        },
        'fill_unused_slots',
        'fill those gaps',
      );
      expect(params.employeeName).toBe('Gevorg Gasparyan');
      expect(params.dateFrom).toBe('02/06/2026');
      expect(params.dateTo).toBe('08/06/2026');
      expect(params.timeFrom).toBe('09:00');
      expect(params.timeTo).toBe('17:00');
    });
  });

  describe('multi-provider date ranges', () => {
    it('sets employeeNames for two providers in prompt', () => {
      const params: Record<string, any> = {};
      applyScheduleOpsPromptHints(
        'apply_schedule',
        params,
        'Apply weekday template to Gevorg and Mary this week',
        { employees, timeZone: 'UTC' },
      );
      expect(params.employeeNames).toEqual([
        'Gevorg Gasparyan',
        'Mary Torgomyan',
      ]);
      expect(params.employeeName).toBeNull();
    });

    it('enriches date range for clear_schedule', () => {
      const params: Record<string, any> = {
        employeeName: 'Gevorg Gasparyan',
      };
      applyScheduleOpsPromptHints(
        'clear_schedule',
        params,
        'Clear Gevorg and Mary schedule from 02/06/2026 to 08/06/2026',
        { employees, timeZone: 'UTC' },
      );
      expect(params.employeeNames).toEqual([
        'Gevorg Gasparyan',
        'Mary Torgomyan',
      ]);
      expect(params.dateFrom).toBe('02/06/2026');
      expect(params.dateTo).toBe('08/06/2026');
    });
  });
});
