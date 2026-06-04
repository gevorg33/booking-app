import { formatWeekdayShortByDayIndex } from '../../common/i18n/locale-date.util.js';
import { formatDateDisplay } from '../../common/utils/date-format.util.js';

describe('public booking assistant locale date helpers', () => {
  it('formats availability weekday and date in Armenian', () => {
    const weekday = formatWeekdayShortByDayIndex(4, 'hy');
    const displayDay = formatDateDisplay('2026-06-04', 'hy');
    expect(weekday).toMatch(/հնգ/i);
    expect(displayDay).toBeTruthy();
    const line = `${weekday} ${displayDay}: 10:00, 11:00`;
    expect(line).toMatch(/հնգ/);
  });

  it('formats nearest-slot style labels in Russian', () => {
    const label = formatDateDisplay('2026-06-04', 'ru');
    expect(label).toBeTruthy();
  });
});
