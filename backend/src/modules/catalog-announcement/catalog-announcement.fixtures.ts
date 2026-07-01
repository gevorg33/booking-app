import type { CatalogAnnouncementTemplateContext } from './catalog-announcement.types.js';

export const CATALOG_ANNOUNCEMENT_RENDER_SCENARIOS: Array<{
  id: string;
  template: { subject: string; bodyText: string };
  context: CatalogAnnouncementTemplateContext;
  expectedSubject: string;
  expectedBody: string;
}> = [
  {
    id: 'package-happy',
    template: {
      subject: 'New package: {{packageName}}',
      bodyText:
        'Hi {{customerName}}, save {{discount}} at {{businessName}}. {{bookUrl}}',
    },
    context: {
      customerName: 'Anna',
      packageName: 'Glow package',
      discount: '15%',
      businessName: 'Demo Salon',
      bookUrl: 'https://book.example/salon',
    },
    expectedSubject: 'New package: Glow package',
    expectedBody: 'Hi Anna, save 15% at Demo Salon. https://book.example/salon',
  },
  {
    id: 'plan-happy',
    template: {
      subject: '{{planName}} membership',
      bodyText: '{{customerName}} — {{discount}} off at {{businessName}}',
    },
    context: {
      customerName: 'Levon',
      planName: 'Nail club',
      discount: '$20',
      businessName: 'Demo Salon',
      bookUrl: 'https://book.example/salon',
    },
    expectedSubject: 'Nail club membership',
    expectedBody: 'Levon — $20 off at Demo Salon',
  },
];

export const CATALOG_NOTIFY_PARSE_SCENARIOS: Array<{
  id: string;
  input: Record<string, unknown>;
  enabledLocales: readonly ('en' | 'hy' | 'ru')[];
  expected: 'null' | 'notify';
}> = [
  { id: 'absent', input: {}, enabledLocales: ['en'], expected: 'null' },
  {
    id: 'false-flag',
    input: { notifyCustomers: false },
    enabledLocales: ['en'],
    expected: 'null',
  },
  {
    id: 'notify-en-only',
    input: {
      notifyCustomers: true,
      notificationTemplate: {
        en: { subject: 'Hi', bodyText: 'Body' },
      },
    },
    enabledLocales: ['en'],
    expected: 'notify',
  },
];
