export const GUEST_CONTACT_SCENARIOS = [
  {
    id: 'stored-profile',
    stored: { id: 'c1', name: 'Alex', email: 'a@test.com', phone: null },
    guest: { name: '', email: '', phone: '' },
    expected: { name: 'Alex', email: 'a@test.com', phone: '' },
    error: null,
  },
  {
    id: 'guest-valid',
    stored: null,
    guest: { name: 'Sam', email: 'sam@test.com', phone: '+37499123456' },
    expected: { name: 'Sam', email: 'sam@test.com', phone: '+37499123456' },
    error: null,
  },
  {
    id: 'guest-missing-contact',
    stored: null,
    guest: { name: 'Sam', email: '', phone: '' },
    expected: null,
    error: 'Enter an email or phone number so we can confirm your booking.',
  },
  {
    id: 'guest-invalid-email',
    stored: null,
    guest: { name: 'Sam', email: 'not-an-email', phone: '' },
    expected: { name: 'Sam', email: 'not-an-email', phone: '' },
    error: 'Enter a valid email address.',
  },
] as const;
