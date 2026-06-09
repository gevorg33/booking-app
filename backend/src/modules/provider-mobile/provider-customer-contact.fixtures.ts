/** prov-exp-6.1 — provider customer contact scenarios. */

export const PROVIDER_CUSTOMER_CONTACT_LINK_SCENARIOS = [
  {
    id: 'tel-link',
    phone: '+1 (555) 123-4567',
    expectedTel: 'tel:+1 (555) 123-4567',
    expectedSms: 'sms:+1 (555) 123-4567',
    expectedWhatsApp: 'https://wa.me/15551234567',
  },
  {
    id: 'local-number',
    phone: '091234567',
    expectedTel: 'tel:091234567',
    expectedSms: 'sms:091234567',
    expectedWhatsApp: 'https://wa.me/091234567',
  },
  {
    id: 'blank-phone',
    phone: '   ',
    expectedTel: null,
    expectedSms: null,
    expectedWhatsApp: null,
  },
] as const;

export const PROVIDER_CUSTOMER_CONTACT_FLAGS_SCENARIOS = [
  {
    id: 'all-channels',
    customerPhone: '+15551234567',
    whatsappEnabledSetting: true,
    whatsappConfigured: true,
    expected: {
      phone: '+15551234567',
      callEnabled: true,
      smsEnabled: true,
      whatsappEnabled: true,
    },
  },
  {
    id: 'whatsapp-disabled-setting',
    customerPhone: '+15551234567',
    whatsappEnabledSetting: false,
    whatsappConfigured: true,
    expected: {
      phone: '+15551234567',
      callEnabled: true,
      smsEnabled: true,
      whatsappEnabled: false,
    },
  },
  {
    id: 'whatsapp-not-configured',
    customerPhone: '+15551234567',
    whatsappEnabledSetting: true,
    whatsappConfigured: false,
    expected: {
      phone: '+15551234567',
      callEnabled: true,
      smsEnabled: true,
      whatsappEnabled: false,
    },
  },
  {
    id: 'missing-phone',
    customerPhone: null,
    whatsappEnabledSetting: true,
    whatsappConfigured: true,
    expected: null,
  },
] as const;

export const PROVIDER_STAFF_CONTACT_ANALYTICS_SCENARIOS = [
  {
    id: 'call',
    bookingId: 'bk-1',
    channel: 'call',
    expected: { bookingId: 'bk-1', contactChannel: 'call' },
  },
  {
    id: 'sms',
    bookingId: 'bk-2',
    channel: 'sms',
    expected: { bookingId: 'bk-2', contactChannel: 'sms' },
  },
  {
    id: 'whatsapp',
    bookingId: 'bk-3',
    channel: 'whatsapp',
    expected: { bookingId: 'bk-3', contactChannel: 'whatsapp' },
  },
] as const;
