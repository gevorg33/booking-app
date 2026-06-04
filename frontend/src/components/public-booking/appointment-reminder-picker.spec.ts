import { describe, it, expect } from 'vitest';
import {
  formatReminderBeforeLabel,
  formatReminderHoursLabel,
} from './appointment-reminder-picker';

describe('appointment-reminder-picker labels', () => {
  const tEn = (key: string, vars?: Record<string, string | number>) => {
    const messages: Record<string, string> = {
      'public.reminderBeforeOption': '{unit} before',
    };
    let out = messages[key] ?? key;
    if (vars) {
      out = out.replace(/\{(\w+)\}/g, (_, name: string) =>
        vars[name] !== undefined ? String(vars[name]) : `{${name}}`,
      );
    }
    return out;
  };

  const tHy = (key: string, vars?: Record<string, string | number>) => {
    let out = key === 'public.reminderBeforeOption' ? '{unit} առաջ' : key;
    if (vars) {
      out = out.replace(/\{(\w+)\}/g, (_, name: string) =>
        vars[name] !== undefined ? String(vars[name]) : `{${name}}`,
      );
    }
    return out;
  };

  it('formats Armenian hour units', () => {
    expect(formatReminderHoursLabel(1, 'hy')).toBe('1 ժամ');
    expect(formatReminderHoursLabel(9, 'hy')).toBe('9 ժամ');
    expect(formatReminderBeforeLabel(4, tHy, 'hy')).toBe('4 ժամ առաջ');
  });

  it('formats Russian hour units with plural rules', () => {
    expect(formatReminderHoursLabel(1, 'ru')).toBe('1 час');
    expect(formatReminderHoursLabel(2, 'ru')).toBe('2 часа');
    expect(formatReminderHoursLabel(5, 'ru')).toBe('5 часов');
    expect(formatReminderHoursLabel(11, 'ru')).toBe('11 часов');
  });

  it('formats English hour units', () => {
    expect(formatReminderHoursLabel(1, 'en')).toBe('1 hour');
    expect(formatReminderHoursLabel(3, 'en')).toBe('3 hours');
    expect(formatReminderBeforeLabel(3, tEn, 'en')).toBe('3 hours before');
  });
});
