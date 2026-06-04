import {
  assertBuiltinVariableKeyAvailable,
  assertValidCustomVariableKey,
  listAllTemplateVariables,
  listResolvedEmailTemplates,
  normalizeCustomVariables,
  readTenantEmailTemplatesSettings,
  renderBusinessEmailTemplate,
  renderTemplateString,
} from './notification-email-template.util.js';

describe('notification-email-template.util', () => {
  it('renders {{variables}} in subject and body', () => {
    expect(renderTemplateString('Hello {{customerName}}', { customerName: 'Alex' })).toBe('Hello Alex');
    expect(renderTemplateString('Missing {{unknown}}', {})).toBe('Missing ');
  });

  it('reads tenant settings safely from malformed business settings', () => {
    expect(readTenantEmailTemplatesSettings(undefined)).toEqual({ customVariables: [], templates: {} });
    expect(readTenantEmailTemplatesSettings({ emailTemplates: null })).toEqual({
      customVariables: [],
      templates: {},
    });
    expect(readTenantEmailTemplatesSettings({ emailTemplates: 'bad' })).toEqual({
      customVariables: [],
      templates: {},
    });
    expect(
      readTenantEmailTemplatesSettings({
        emailTemplates: {
          customVariables: 'bad',
          templates: 'bad',
        },
      }),
    ).toEqual({ customVariables: [], templates: {} });
  });

  it('lists all template variables including custom tenant variables', () => {
    const variables = listAllTemplateVariables({
      emailTemplates: {
        customVariables: [
          { key: 'promo_line', label: 'Promo', defaultValue: '10% off' },
          { key: '   ', label: 'Ignored', defaultValue: '' },
        ],
      },
    });

    expect(variables.some((v) => v.key === 'customerName' && !v.custom)).toBe(true);
    expect(variables.find((v) => v.key === 'promo_line')).toEqual(
      expect.objectContaining({ custom: true, sampleValue: '10% off', label: 'Promo' }),
    );
    expect(
      listAllTemplateVariables({
        emailTemplates: {
          customVariables: [{ key: 'tagline', label: '', defaultValue: 'Welcome' }],
        },
      }).find((v) => v.key === 'tagline')?.label,
    ).toBe('tagline');
    expect(
      listAllTemplateVariables({
        emailTemplates: {
          customVariables: [{ key: 'note', label: 'Note', defaultValue: undefined as unknown as string }],
        },
      }).find((v) => v.key === 'note')?.sampleValue,
    ).toBe('');
    expect(variables.some((v) => v.key === '   ')).toBe(false);
  });

  it('uses platform defaults when tenant has no override', () => {
    const email = renderBusinessEmailTemplate(undefined, 'booking_confirmation', {
      customerName: 'Alex',
      businessName: 'Glow Salon',
      serviceName: 'Haircut',
      providerName: 'Jane',
      dateLabel: '03/06/2026',
      timeLabel: '14:00',
      manageLinkText: '',
      manageLinkHtml: '',
      footerNote: 'See you soon!',
    });
    expect(email?.subject).toContain('Haircut');
    expect(email?.text).toContain('Alex');
    expect(email?.html).toContain('Glow Salon');
  });

  it('applies tenant template overrides from business settings', () => {
    const email = renderBusinessEmailTemplate(
      {
        emailTemplates: {
          templates: {
            booking_reminder: {
              subject: 'Heads up {{customerName}}',
              bodyText: 'See you in {{reminderLabel}} for {{serviceName}}',
              bodyHtml: '<p>See you in {{reminderLabel}}</p>',
            },
          },
        },
      },
      'booking_reminder',
      {
        customerName: 'Sam',
        reminderLabel: '1 hour',
        serviceName: 'Facial',
      },
    );
    expect(email?.subject).toBe('Heads up Sam');
    expect(email?.text).toContain('1 hour');
  });

  it('returns null when tenant disables a template', () => {
    const email = renderBusinessEmailTemplate(
      {
        emailTemplates: {
          templates: { booking_cancellation: { enabled: false } },
        },
      },
      'booking_cancellation',
      { customerName: 'Alex' },
    );
    expect(email).toBeNull();
  });

  it('merges custom variable defaults into render context', () => {
    const email = renderBusinessEmailTemplate(
      {
        emailTemplates: {
          customVariables: [
            { key: 'footerNote', label: 'Footer', defaultValue: 'Thanks!' },
            { key: '', label: 'Ignored', defaultValue: 'Nope' },
            { key: 'note', label: 'Note', defaultValue: null as unknown as string },
          ],
        },
      },
      'booking_confirmation',
      {
        customerName: 'Alex',
        businessName: 'Glow',
        serviceName: 'Cut',
        providerName: 'Jane',
        dateLabel: 'Today',
        timeLabel: '10:00',
        manageLinkText: '',
        manageLinkHtml: '',
      },
    );
    expect(email?.text).toContain('Thanks!');
  });

  it('skips null runtime variables when rendering templates', () => {
    const email = renderBusinessEmailTemplate(undefined, 'booking_reminder', {
      customerName: 'Alex',
      reminderLabel: null,
      serviceName: undefined,
      businessName: 'Glow',
      providerName: 'Jane',
      dateLabel: 'Today',
      timeLabel: '10:00',
    });
    expect(email?.subject).not.toContain('null');
    expect(email?.text).not.toContain('undefined');
  });

  it('lets runtime variables override custom variable defaults', () => {
    const email = renderBusinessEmailTemplate(
      {
        emailTemplates: {
          customVariables: [{ key: 'footerNote', label: 'Footer', defaultValue: 'Default footer' }],
        },
      },
      'booking_confirmation',
      {
        customerName: 'Alex',
        businessName: 'Glow',
        serviceName: 'Cut',
        providerName: 'Jane',
        dateLabel: 'Today',
        timeLabel: '10:00',
        manageLinkText: '',
        manageLinkHtml: '',
        footerNote: 'Runtime footer',
      },
    );
    expect(email?.text).toContain('Runtime footer');
    expect(email?.text).not.toContain('Default footer');
  });

  it('uses Armenian localized defaults when business locale is hy', () => {
    const templates = listResolvedEmailTemplates({ locale: 'hy' });
    const confirmation = templates.find((t) => t.key === 'booking_confirmation');
    expect(confirmation?.subject).toContain('Հաստատված');
    expect(confirmation?.bodyText).toContain('Բարև {{customerName}}');
  });

  it('prefers tenant subject override over locale defaults', () => {
    const templates = listResolvedEmailTemplates({
      locale: 'ru',
      emailTemplates: {
        templates: {
          booking_reminder: { subject: 'Tenant RU {{customerName}}' },
        },
      },
    });
    expect(templates.find((t) => t.key === 'booking_reminder')?.subject).toBe(
      'Tenant RU {{customerName}}',
    );
  });

  it('renders Russian default booking_cancellation from locale', () => {
    const email = renderBusinessEmailTemplate(
      { locale: 'ru' },
      'booking_cancellation',
      {
        customerName: 'Alex',
        businessName: 'Glow',
        serviceName: 'Facial',
        dateLabel: '05.06.2026',
        timeLabel: '10:00–10:30',
        cancelReason: 'Customer request',
      },
    );
    expect(email?.subject).toContain('Отменено');
    expect(email?.text).toContain('отменена');
  });

  it('lists resolved templates with customization flag', () => {
    const templates = listResolvedEmailTemplates({
      emailTemplates: {
        templates: {
          review_request: { subject: 'Custom subject' },
        },
      },
    });
    expect(templates.find((t) => t.key === 'review_request')?.isCustomized).toBe(true);
    expect(templates.find((t) => t.key === 'booking_reminder')?.isCustomized).toBe(false);
  });

  it('validates custom variable keys and normalization rules', () => {
    expect(() => assertValidCustomVariableKey('1bad')).toThrow(/Variable key must start with a letter/);
    expect(() => assertBuiltinVariableKeyAvailable('customerName')).toThrow(/reserved/i);
    expect(assertBuiltinVariableKeyAvailable('promo_line', { emailTemplates: {} })).toBeUndefined();
    expect(
      normalizeCustomVariables([{ key: 'my_promo', label: 'Promo', defaultValue: '10% off' }]),
    ).toEqual([{ key: 'my_promo', label: 'Promo', defaultValue: '10% off' }]);
    expect(
      normalizeCustomVariables([
        { key: ' promo_line ', label: '  ', defaultValue: undefined as unknown as string },
      ]),
    ).toEqual([{ key: 'promo_line', label: 'promo_line', defaultValue: '' }]);
    expect(() =>
      normalizeCustomVariables([
        { key: 'promo_line', label: 'One', defaultValue: 'A' },
        { key: 'promo_line', label: 'Two', defaultValue: 'B' },
      ]),
    ).toThrow(/Duplicate custom variable key/);
    expect(
      normalizeCustomVariables([
        { key: '', label: 'Empty', defaultValue: 'ignored' },
        { key: 'valid_key', label: 'Valid', defaultValue: 'ok' },
      ]),
    ).toEqual([{ key: 'valid_key', label: 'Valid', defaultValue: 'ok' }]);
  });
});
