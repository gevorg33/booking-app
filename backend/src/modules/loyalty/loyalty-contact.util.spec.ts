import {
  collectContactCandidates,
  normalizeLoyaltyEmail,
  normalizeLoyaltyPhone,
} from './loyalty-contact.util.js';

describe('loyalty-contact.util', () => {
  it('normalizes email casing and whitespace', () => {
    expect(normalizeLoyaltyEmail('  User@Example.COM ')).toBe(
      'user@example.com',
    );
  });

  it('normalizes phone formats to digits', () => {
    expect(normalizeLoyaltyPhone('+1 (555) 123-4567')).toBe('15551234567');
    expect(normalizeLoyaltyPhone('374 91 234567')).toBe('37491234567');
  });

  it('collects contacts from metadata and guest payload', () => {
    const contacts = collectContactCandidates({
      metadata: {
        customerEmail: 'Guest@Mail.com',
        customerPhone: '+37491234567',
        guest: { email: 'other@mail.com' },
      },
    });

    expect(contacts.emails).toEqual(
      expect.arrayContaining(['guest@mail.com', 'other@mail.com']),
    );
    expect(contacts.phones).toEqual(['37491234567']);
  });
});
