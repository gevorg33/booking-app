export const CHECKOUT_AUTOFILL_SCENARIOS = [
  {
    id: 'profile-wins',
    sources: {
      profile: { id: 'c1', name: 'Alex', email: 'a@test.com', phone: '+100' },
      draft: { name: 'Draft', email: 'd@test.com', phone: '+200' },
      remembered: { name: 'Old', email: 'o@test.com', phone: '+300' },
    },
    expected: { name: 'Alex', email: 'a@test.com', phone: '+100' },
  },
  {
    id: 'draft-fills-gaps',
    sources: {
      profile: null,
      draft: { name: 'Sam', email: '', phone: '+37499123456' },
      remembered: { name: 'Old', email: 'o@test.com', phone: '+300' },
    },
    expected: { name: 'Sam', email: 'o@test.com', phone: '+37499123456' },
  },
  {
    id: 'remembered-only',
    sources: {
      profile: null,
      draft: null,
      remembered: { name: 'Jordan', email: 'j@test.com', phone: '' },
    },
    expected: { name: 'Jordan', email: 'j@test.com', phone: '' },
  },
  {
    id: 'empty',
    sources: { profile: null, draft: null, remembered: null },
    expected: { name: '', email: '', phone: '' },
  },
] as const;
