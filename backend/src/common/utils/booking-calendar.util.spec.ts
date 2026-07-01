import {
  buildBookingCalendarEventInput,
  buildBookingCalendarLinks,
  buildGoogleCalendarUrl,
  buildIcsEventContent,
  buildOutlookCalendarUrl,
  formatUtcForIcs,
} from './booking-calendar.util.js';

describe('booking-calendar.util (ai-cmd-customer-4.3.2)', () => {
  const startTime = new Date('2026-07-15T14:00:00.000Z');
  const endTime = new Date('2026-07-15T15:00:00.000Z');
  const event = buildBookingCalendarEventInput({
    bookingId: 'book-1',
    serviceName: 'Massage',
    providerName: 'Anna Kim',
    businessName: 'Glow Salon',
    businessAddress: '12 Main St',
    startTime,
    endTime,
  });

  it('formats UTC timestamps for ICS', () => {
    expect(formatUtcForIcs(startTime)).toBe('20260715T140000Z');
  });

  it('builds ICS content', () => {
    const ics = buildIcsEventContent(event);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('SUMMARY:Massage with Anna Kim');
    expect(ics).toContain('LOCATION:Glow Salon — 12 Main St');
    expect(ics).toContain('UID:booking-book-1@optischedule');
  });

  it('builds Google and Outlook calendar URLs', () => {
    expect(buildGoogleCalendarUrl(event)).toContain('calendar.google.com');
    expect(buildGoogleCalendarUrl(event)).toContain('Massage');
    expect(buildOutlookCalendarUrl(event)).toContain('outlook.live.com');
  });

  it('builds calendar link bundle with ICS download URL', () => {
    const links = buildBookingCalendarLinks({
      event,
      publicApiUrl: 'https://api.test',
      slug: 'glow-salon',
      manageToken: 'tok-1',
    });
    expect(links.googleCalendarUrl).toContain('calendar.google.com');
    expect(links.outlookCalendarUrl).toContain('outlook.live.com');
    expect(links.icsDownloadUrl).toBe(
      'https://api.test/public/glow-salon/bookings/manage/calendar.ics?bookingId=book-1&token=tok-1',
    );
  });

  it('omits optional ICS location when address is absent', () => {
    const minimal = buildBookingCalendarEventInput({
      bookingId: 'book-2',
      serviceName: 'Facial',
      startTime,
      endTime,
    });
    const ics = buildIcsEventContent(minimal);
    expect(ics).not.toContain('LOCATION:');
    expect(buildGoogleCalendarUrl(minimal)).not.toContain('location=');
  });
});
