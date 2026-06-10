import {
  STAFF_MESSAGE_TEMPLATE_FEATURE_SCENARIOS,
  STAFF_MESSAGE_TEMPLATE_LINK_SCENARIOS,
  STAFF_MESSAGE_TEMPLATE_NORMALIZE_SCENARIOS,
  STAFF_MESSAGE_TEMPLATE_RESOLVE_SCENARIOS,
} from './provider-staff-message-templates.fixtures.js';
import {
  buildCustomerSmsLinkWithBody,
  buildCustomerWhatsAppLinkWithBody,
  isStaffMessageTemplatesFeatureEnabled,
  listActiveStaffMessageTemplates,
  normalizeStaffMessageTemplatesSettings,
  readStaffMessageTemplatesSettings,
  resolveStaffMessageTemplateBody,
  resolveStaffMessageTemplatesForBooking,
  serializeStaffMessageTemplatesSettings,
  slugifyStaffMessageTemplateId,
  normalizeStaffMessageTemplate,
} from './provider-staff-message-templates.util.js';

describe('provider-staff-message-templates.util (prov-exp-6.2)', () => {
  it.each(STAFF_MESSAGE_TEMPLATE_RESOLVE_SCENARIOS.map((s) => [s.id, s]))(
    'resolves template body for %s',
    (_id, scenario) => {
      expect(
        resolveStaffMessageTemplateBody(scenario.body, scenario.context),
      ).toBe(scenario.expected);
    },
  );

  it.each(STAFF_MESSAGE_TEMPLATE_FEATURE_SCENARIOS.map((s) => [s.id, s]))(
    'evaluates feature availability for %s',
    (_id, scenario) => {
      expect(isStaffMessageTemplatesFeatureEnabled(scenario.settings)).toBe(
        scenario.expectedEnabled,
      );
      expect(listActiveStaffMessageTemplates(scenario.settings)).toHaveLength(
        scenario.expectedCount,
      );
    },
  );

  it.each(STAFF_MESSAGE_TEMPLATE_LINK_SCENARIOS.map((s) => [s.id, s]))(
    'builds prefilled links for %s',
    (_id, scenario) => {
      expect(buildCustomerSmsLinkWithBody(scenario.phone, scenario.body)).toBe(
        scenario.expectedSms,
      );
      expect(
        buildCustomerWhatsAppLinkWithBody(scenario.phone, scenario.body),
      ).toBe(scenario.expectedWhatsApp);
    },
  );

  it.each(STAFF_MESSAGE_TEMPLATE_NORMALIZE_SCENARIOS.map((s) => [s.id, s]))(
    'normalizes settings for %s',
    (_id, scenario) => {
      expect(normalizeStaffMessageTemplatesSettings(scenario.input)).toEqual(
        scenario.expected,
      );
    },
  );

  it('reads settings from business.settings blob', () => {
    expect(
      readStaffMessageTemplatesSettings({
        staffMessageTemplates: {
          enabled: true,
          templates: [
            {
              id: 'late',
              label: 'Late',
              body: 'Sorry!',
              enabled: true,
            },
          ],
        },
      }),
    ).toEqual({
      enabled: true,
      templates: [
        {
          id: 'late',
          label: 'Late',
          body: 'Sorry!',
          enabled: true,
        },
      ],
    });
  });

  it('resolves booking templates with placeholders applied', () => {
    const templates = resolveStaffMessageTemplatesForBooking(
      { enabled: true, templates: [] },
      {
        customerName: 'Alex',
        businessName: 'Glow',
        appointmentTime: '4 PM',
      },
    );
    expect(templates).toHaveLength(2);
    expect(templates[0]?.body).toContain('Alex');
  });

  it('slugifies empty labels to generated ids', () => {
    expect(slugifyStaffMessageTemplateId('!!!')).toMatch(/^template-/);
  });

  it('deduplicates template ids on normalize', () => {
    expect(
      normalizeStaffMessageTemplatesSettings({
        enabled: true,
        templates: [
          { id: 'late', label: 'Late A', body: 'A', enabled: true },
          { id: 'late', label: 'Late B', body: 'B', enabled: true },
        ],
      }).templates.map((row) => row.id),
    ).toEqual(['late', 'late-2']);
  });

  it('serializes settings for business.settings patch', () => {
    expect(
      serializeStaffMessageTemplatesSettings({
        enabled: true,
        templates: [
          { id: 'late', label: 'Late', body: 'Sorry', enabled: true },
        ],
      }),
    ).toEqual({
      staffMessageTemplates: {
        enabled: true,
        templates: [
          { id: 'late', label: 'Late', body: 'Sorry', enabled: true },
        ],
      },
    });
  });

  it('ignores unknown placeholders and invalid template rows', () => {
    expect(
      resolveStaffMessageTemplateBody('Hi {unknown}', {
        customerName: 'Alex',
      }),
    ).toBe('Hi ');
    expect(
      readStaffMessageTemplatesSettings({
        staffMessageTemplates: {
          enabled: true,
          templates: 'invalid',
        },
      }).templates,
    ).toEqual([]);
  });

  it('normalizes individual template rows', () => {
    expect(normalizeStaffMessageTemplate(null)).toBeNull();
    expect(
      normalizeStaffMessageTemplate({
        label: 'Late',
        body: 'Sorry',
        enabled: false,
      }),
    ).toEqual({
      id: 'late',
      label: 'Late',
      body: 'Sorry',
      enabled: false,
    });
    expect(
      buildCustomerSmsLinkWithBody('   ', 'Hello'),
    ).toBeNull();
    expect(
      buildCustomerWhatsAppLinkWithBody('abc', 'Hello'),
    ).toBeNull();
  });
});
