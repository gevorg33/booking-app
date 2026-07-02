/** prov-exp-6.2 — staff message template scenarios. */

export const STAFF_MESSAGE_TEMPLATE_RESOLVE_SCENARIOS = [
  {
    id: 'customer-name-placeholder',
    body: 'Hi {customerName}, see you soon.',
    context: {
      customerName: 'Alex',
      businessName: 'Glow Salon',
      appointmentTime: '3:00 PM',
    },
    expected: 'Hi Alex, see you soon.',
  },
  {
    id: 'missing-customer-name-fallback',
    body: 'Hi {customerName}!',
    context: {
      customerName: null,
      businessName: 'Glow Salon',
      appointmentTime: '3:00 PM',
    },
    expected: 'Hi there!',
  },
  {
    id: 'all-placeholders',
    body: '{customerName} at {businessName} on {appointmentTime}',
    context: {
      customerName: 'Sam',
      businessName: 'Studio',
      appointmentTime: '10:00',
    },
    expected: 'Sam at Studio on 10:00',
  },
] as const;

export const STAFF_MESSAGE_TEMPLATE_FEATURE_SCENARIOS = [
  {
    id: 'disabled',
    settings: { enabled: false, templates: [] },
    expectedEnabled: false,
    expectedCount: 0,
  },
  {
    id: 'enabled-with-custom-template',
    settings: {
      enabled: true,
      templates: [
        {
          id: 'custom-1',
          label: 'On my way',
          body: 'On my way!',
          enabled: true,
        },
      ],
    },
    expectedEnabled: true,
    expectedCount: 1,
  },
  {
    id: 'enabled-with-default-fallback',
    settings: { enabled: true, templates: [] },
    expectedEnabled: true,
    expectedCount: 2,
  },
  {
    id: 'enabled-but-all-disabled',
    settings: {
      enabled: true,
      templates: [
        {
          id: 'off',
          label: 'Hidden',
          body: 'Hidden body',
          enabled: false,
        },
      ],
    },
    expectedEnabled: false,
    expectedCount: 0,
  },
] as const;

export const STAFF_MESSAGE_TEMPLATE_LINK_SCENARIOS = [
  {
    id: 'sms-with-body',
    phone: '+15551234567',
    body: 'Running late',
    expectedSms: 'sms:+15551234567?body=Running%20late',
    expectedWhatsApp: 'https://wa.me/15551234567?text=Running%20late',
  },
  {
    id: 'whatsapp-empty-body',
    phone: '+15551234567',
    body: '   ',
    expectedSms: 'sms:+15551234567',
    expectedWhatsApp: 'https://wa.me/15551234567',
  },
] as const;

export const STAFF_MESSAGE_TEMPLATE_NORMALIZE_SCENARIOS = [
  {
    id: 'trims-and-caps',
    input: {
      enabled: true,
      templates: [
        {
          id: '  tpl-1  ',
          label: '  Running late  ',
          body: '  Be there soon  ',
          enabled: true,
        },
      ],
    },
    expected: {
      enabled: true,
      templates: [
        {
          id: 'tpl-1',
          label: 'Running late',
          body: 'Be there soon',
          enabled: true,
        },
      ],
    },
  },
  {
    id: 'drops-invalid-rows',
    input: {
      enabled: true,
      templates: [{ id: 'x', label: '', body: 'Body', enabled: true }],
    },
    expected: {
      enabled: true,
      templates: [],
    },
  },
] as const;
