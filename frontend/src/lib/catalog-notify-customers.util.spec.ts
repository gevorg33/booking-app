import { describe, expect, it } from 'vitest';
import {
  buildCatalogNotifyBookUrl,
  buildCatalogNotifyPreviewVariables,
  buildCatalogNotifySavePayload,
  catalogNotifyPreviewHasContent,
  catalogNotifyTemplateIsComplete,
  defaultCatalogNotifyFormState,
  formatCatalogNotifyDiscountLabel,
  patchCatalogNotifyLocaleTemplate,
  renderCatalogAnnouncementTemplate,
  renderCatalogNotifyPreview,
} from './catalog-notify-customers.util';

describe('catalog-notify-customers.util', () => {
  it('defaults to skip notify', () => {
    expect(defaultCatalogNotifyFormState()).toEqual({ mode: 'skip', template: {} });
    expect(buildCatalogNotifySavePayload(defaultCatalogNotifyFormState())).toEqual({
      notifyCustomers: false,
    });
  });

  it('builds notify payload with per-locale template', () => {
    const payload = buildCatalogNotifySavePayload({
      mode: 'notify',
      template: {
        en: { subject: 'New package', bodyText: 'Book {{packageName}} today.' },
        hy: { subject: 'Փաթեթ', bodyText: 'Պատվիրեք {{packageName}}' },
      },
    });
    expect(payload.notifyCustomers).toBe(true);
    expect(payload.notificationTemplate?.en?.subject).toBe('New package');
  });

  it('patches locale template immutably', () => {
    const next = patchCatalogNotifyLocaleTemplate({}, 'en', { subject: 'Hi' });
    expect(next.en).toEqual({ subject: 'Hi', bodyText: '' });
  });

  it('validates all enabled locales have subject and body', () => {
    expect(
      catalogNotifyTemplateIsComplete(
        {
          mode: 'notify',
          template: { en: { subject: 'A', bodyText: 'B' } },
        },
        ['en', 'hy'],
      ),
    ).toBe(false);
    expect(
      catalogNotifyTemplateIsComplete(
        {
          mode: 'notify',
          template: {
            en: { subject: 'A', bodyText: 'B' },
            hy: { subject: 'C', bodyText: 'D' },
          },
        },
        ['en', 'hy'],
      ),
    ).toBe(true);
  });

  it('renders template variables for preview', () => {
    expect(
      renderCatalogAnnouncementTemplate('Hi {{customerName}}, save {{discount}} on {{packageName}}', {
        customerName: 'Anna',
        discount: '15%',
        packageName: 'Spa Day',
      }),
    ).toBe('Hi Anna, save 15% on Spa Day');
  });

  it('builds preview variables per locale and kind', () => {
    const vars = buildCatalogNotifyPreviewVariables(
      {
        kind: 'subscription_plan',
        catalogName: 'Nail Club',
        discountLabel: '10%',
        businessName: 'Glow Salon',
        bookUrl: 'https://example.com/book/glow',
      },
      'hy',
    );
    expect(vars.customerName).toBe('Աննա');
    expect(vars.planName).toBe('Nail Club');
  });

  it('renders full preview for package locale', () => {
    const rendered = renderCatalogNotifyPreview(
      {
        subject: 'New: {{packageName}}',
        bodyText: 'Hi {{customerName}}, {{discount}} off at {{businessName}} — {{bookUrl}}',
      },
      {
        kind: 'package',
        catalogName: 'Spa Day',
        discountLabel: '20%',
        businessName: 'Glow Salon',
        bookUrl: 'https://example.com/book/glow/any',
      },
      'en',
    );
    expect(rendered.subject).toBe('New: Spa Day');
    expect(rendered.bodyText).toContain('Hi Anna');
    expect(rendered.bodyText).toContain('https://example.com/book/glow/any');
  });

  it('formats discount labels and book urls', () => {
    expect(formatCatalogNotifyDiscountLabel('percent', 12.4)).toBe('12%');
    expect(formatCatalogNotifyDiscountLabel('fixed', 25, (n) => `$${n}`)).toBe('$25');
    expect(buildCatalogNotifyBookUrl('glow', 'package', 'https://app.test')).toBe(
      'https://app.test/book/glow/any',
    );
  });

  it('detects whether preview has content', () => {
    expect(catalogNotifyPreviewHasContent({ subject: '', bodyText: '' })).toBe(false);
    expect(catalogNotifyPreviewHasContent({ subject: 'Hi', bodyText: '' })).toBe(true);
  });
});
