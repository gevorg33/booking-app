import {
  EMAIL_TEMPLATE_DEFINITIONS,
  getEmailTemplateDefinition,
  resolveEmailTemplate,
} from './notification-email-template.defaults.js';

describe('notification-email-template.defaults', () => {
  it('exports all seven template definitions', () => {
    expect(EMAIL_TEMPLATE_DEFINITIONS).toHaveLength(7);
    expect(EMAIL_TEMPLATE_DEFINITIONS.map((def) => def.key)).toEqual([
      'booking_confirmation',
      'booking_confirmation_grouped',
      'booking_reminder',
      'booking_cancellation',
      'review_request',
      'gift_card_recipient',
      'gift_card_purchaser_receipt',
    ]);
  });

  it('returns a definition for each known key', () => {
    for (const def of EMAIL_TEMPLATE_DEFINITIONS) {
      expect(getEmailTemplateDefinition(def.key).key).toBe(def.key);
    }
  });

  it('throws for unknown template keys', () => {
    expect(() => getEmailTemplateDefinition('unknown_key' as never)).toThrow(
      /Unknown email template/,
    );
  });

  it('falls back to defaults when override fields are blank', () => {
    const resolved = resolveEmailTemplate('booking_reminder', {
      subject: '   ',
      bodyText: '',
      bodyHtml: '\n',
    });
    const def = getEmailTemplateDefinition('booking_reminder');
    expect(resolved.subject).toBe(def.subject);
    expect(resolved.bodyText).toBe(def.bodyText);
    expect(resolved.bodyHtml).toBe(def.bodyHtml);
    expect(resolved.isCustomized).toBe(false);
  });

  it('marks disabled templates as customized', () => {
    const resolved = resolveEmailTemplate('review_request', { enabled: false });
    expect(resolved.enabled).toBe(false);
    expect(resolved.isCustomized).toBe(true);
  });

  it('marks partial overrides as customized', () => {
    const resolved = resolveEmailTemplate('gift_card_recipient', {
      bodyHtml: '<p>Custom HTML</p>',
    });
    expect(resolved.bodyHtml).toBe('<p>Custom HTML</p>');
    expect(resolved.isCustomized).toBe(true);
  });
});
