import {
  mergeMarketingNotificationSettings,
  parseMarketingTeamEmails,
  serializeMarketingTeamEmailsInput,
} from './marketing-notification-settings.util.js';

describe('marketing-notification-settings.util', () => {
  it('parses comma-separated emails', () => {
    expect(parseMarketingTeamEmails('a@x.com, b@y.com')).toEqual([
      'a@x.com',
      'b@y.com',
    ]);
  });

  it('parses newline-separated emails and ignores non-strings in arrays', () => {
    expect(parseMarketingTeamEmails('a@x.com\nb@y.com')).toEqual([
      'a@x.com',
      'b@y.com',
    ]);
    expect(parseMarketingTeamEmails(['c@z.com', 99, 'c@z.com'])).toEqual([
      'c@z.com',
    ]);
  });

  it('dedupes and rejects invalid addresses', () => {
    expect(parseMarketingTeamEmails(['A@X.com', 'bad', 'a@x.com'])).toEqual([
      'a@x.com',
    ]);
  });

  it('merges marketing notification flags', () => {
    expect(
      mergeMarketingNotificationSettings({
        emailOnNewCustomerRegistration: true,
        marketingTeamEmails: 'ops@test.com',
      }),
    ).toEqual({
      emailOnNewCustomerRegistration: true,
      marketingTeamEmails: ['ops@test.com'],
    });
  });

  it('returns empty list for unsupported input', () => {
    expect(parseMarketingTeamEmails(42)).toEqual([]);
  });

  it('serializes textarea input', () => {
    expect(
      serializeMarketingTeamEmailsInput('one@test.com; two@test.com'),
    ).toEqual(['one@test.com', 'two@test.com']);
  });
});
