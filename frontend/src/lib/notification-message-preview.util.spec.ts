import { describe, expect, it } from 'vitest';
import {
  buildNotificationPreviewVariables,
  buildWhatsAppBookingTemplatePreview,
  emailSupportsWhatsAppPreview,
  plainTextToEmailHtml,
  renderNotificationMessagePreview,
  renderNotificationTemplateString,
} from './notification-message-preview.util';

describe('notification-message-preview.util', () => {
  it('renders template variables', () => {
    expect(
      renderNotificationTemplateString('Hi {{customerName}} at {{businessName}}', {
        customerName: 'Alex',
        businessName: 'Glow',
      }),
    ).toBe('Hi Alex at Glow');
  });

  it('builds preview variables from samples', () => {
    const vars = buildNotificationPreviewVariables(
      [{ key: 'customerName', sampleValue: 'Alex' }],
      { footerNote: 'Thanks' },
    );
    expect(vars).toEqual({ footerNote: 'Thanks', customerName: 'Alex' });
  });

  it('renders email preview fields', () => {
    const rendered = renderNotificationMessagePreview(
      'Hello {{customerName}}',
      'Your {{serviceName}} is confirmed.',
      '<p>HTML {{serviceName}}</p>',
      { customerName: 'Alex', serviceName: 'Haircut' },
    );
    expect(rendered.subject).toBe('Hello Alex');
    expect(rendered.bodyText).toBe('Your Haircut is confirmed.');
    expect(rendered.bodyHtml).toBe('<p>HTML Haircut</p>');
  });

  it('converts plain text to simple email html', () => {
    expect(plainTextToEmailHtml('Line one\nLine two')).toBe(
      '<p>Line one<br/>Line two</p>',
    );
  });

  it('detects whatsapp-eligible booking templates', () => {
    expect(emailSupportsWhatsAppPreview('booking_confirmation')).toBe(true);
    expect(emailSupportsWhatsAppPreview('gift_card_recipient')).toBe(false);
  });

  it('builds whatsapp confirmation template preview', () => {
    const preview = buildWhatsAppBookingTemplatePreview(
      'booking_confirmation',
      {
        customerName: 'Alex',
        businessName: 'Glow Salon',
        serviceName: 'Haircut',
        dateLabel: 'Friday, Jun 12',
        timeLabel: '2:00 PM',
      },
      {
        templateConfirmation: 'booking_confirmed_v2',
        templateReminder: 'booking_reminder_v2',
        templateLanguage: 'en',
      },
    );
    expect(preview?.templateName).toBe('booking_confirmed_v2');
    expect(preview?.bodyParams).toEqual([
      'Alex',
      'Haircut',
      'Glow Salon',
      'Friday, Jun 12 2:00 PM',
    ]);
  });
});
