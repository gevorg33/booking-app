import {
  formatNotificationDateDisplay,
  formatNotificationExpiresLabel,
  formatNotificationTimeRangeDisplay,
  formatResultReadyNotificationWhen,
  notificationDateDisplayOptions,
  readNotificationDateFormatSettings,
} from './notification-date-format.util.js';

const instant = '2026-06-04T10:00:00.000Z';
const endInstant = '2026-06-04T11:00:00.000Z';
const expiryInstant = '2027-06-01T00:00:00.000Z';
const resultInstant = '2026-08-15T14:00:00.000Z';

const FORMAT_MATRIX = [
  {
    id: 'ddmm-24h',
    settings: { dateFormat: 'DD/MM/YYYY', timeFormat: '24h' },
    date: '04/06/2026',
    expiry: '01/06/2027',
    resultReady: '15/08/2026',
    timePattern: /10:00–11:00/,
  },
  {
    id: 'ddmm-12h',
    settings: { dateFormat: 'DD/MM/YYYY', timeFormat: '12h' },
    date: '04/06/2026',
    expiry: '01/06/2027',
    resultReady: '15/08/2026',
    timePattern: /10:00\s*AM/i,
  },
  {
    id: 'mmdd-24h',
    settings: { dateFormat: 'MM/DD/YYYY', timeFormat: '24h' },
    date: '06/04/2026',
    expiry: '06/01/2027',
    resultReady: '08/15/2026',
    timePattern: /10:00–11:00/,
  },
  {
    id: 'mmdd-12h',
    settings: { dateFormat: 'MM/DD/YYYY', timeFormat: '12h' },
    date: '06/04/2026',
    expiry: '06/01/2027',
    resultReady: '08/15/2026',
    timePattern: /10:00\s*AM/i,
  },
  {
    id: 'iso-24h',
    settings: { dateFormat: 'YYYY-MM-DD', timeFormat: '24h' },
    date: '2026-06-04',
    expiry: '2027-06-01',
    resultReady: '2026-08-15',
    timePattern: /10:00–11:00/,
  },
  {
    id: 'iso-12h',
    settings: { dateFormat: 'YYYY-MM-DD', timeFormat: '12h' },
    date: '2026-06-04',
    expiry: '2027-06-01',
    resultReady: '2026-08-15',
    timePattern: /10:00\s*AM/i,
  },
] as const;

describe('notification-date-format.util', () => {
  describe('notificationDateDisplayOptions / readNotificationDateFormatSettings', () => {
    it('reads explicit business settings', () => {
      expect(
        notificationDateDisplayOptions({
          dateFormat: 'MM/DD/YYYY',
          timeFormat: '12h',
        }),
      ).toEqual({ dateFormat: 'MM/DD/YYYY', timeFormat: '12h' });
      expect(
        readNotificationDateFormatSettings({
          dateFormat: 'YYYY-MM-DD',
          timeFormat: '24h',
        }),
      ).toEqual({ dateFormat: 'YYYY-MM-DD', timeFormat: '24h' });
    });

    it.each([null, undefined, {}] as const)(
      'falls back to DD/MM/YYYY + 24h when settings are %s',
      (settings) => {
        expect(notificationDateDisplayOptions(settings)).toEqual({
          dateFormat: 'DD/MM/YYYY',
          timeFormat: '24h',
        });
        expect(readNotificationDateFormatSettings(settings)).toEqual({
          dateFormat: 'DD/MM/YYYY',
          timeFormat: '24h',
        });
      },
    );

    it('ignores invalid format values in settings', () => {
      expect(
        notificationDateDisplayOptions({
          dateFormat: 'bad',
          timeFormat: 'nope',
        }),
      ).toEqual({ dateFormat: 'DD/MM/YYYY', timeFormat: '24h' });
    });
  });

  describe.each(FORMAT_MATRIX)(
    'format matrix — $id',
    ({ settings, date, expiry, resultReady, timePattern }) => {
      it('formats notification date from ISO string', () => {
        expect(formatNotificationDateDisplay(instant, settings, 'en')).toBe(
          date,
        );
      });

      it('formats notification date from Date object', () => {
        expect(
          formatNotificationDateDisplay(new Date(instant), settings, 'en'),
        ).toBe(date);
      });

      it('formats notification date from YYYY-MM-DD key', () => {
        expect(
          formatNotificationDateDisplay('2026-06-04', settings, 'en'),
        ).toBe(date);
      });

      it('formats notification time range', () => {
        expect(
          formatNotificationTimeRangeDisplay(
            instant,
            endInstant,
            settings,
            'en',
          ),
        ).toMatch(timePattern);
      });

      it('formats gift card expiry label', () => {
        expect(
          formatNotificationExpiresLabel(expiryInstant, settings, 'en'),
        ).toBe(expiry);
      });

      it('formats clinic result-ready when label', () => {
        expect(
          formatResultReadyNotificationWhen(resultInstant, settings, 'en'),
        ).toBe(resultReady);
      });
    },
  );

  it('accepts null settings on all formatters', () => {
    expect(formatNotificationDateDisplay('2026-06-04', null, 'en')).toBe(
      '04/06/2026',
    );
    expect(
      formatNotificationTimeRangeDisplay(instant, endInstant, null, 'en'),
    ).toMatch(/10:00–11:00/);
    expect(formatNotificationExpiresLabel(expiryInstant, null)).toBe(
      '01/06/2027',
    );
    expect(formatResultReadyNotificationWhen(resultInstant, null)).toBe(
      '15/08/2026',
    );
  });
});
