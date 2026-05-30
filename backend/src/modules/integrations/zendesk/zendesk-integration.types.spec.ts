import { getBusinessZendeskIntegration } from './zendesk-integration.types.js';

describe('zendesk-integration.types', () => {
  it('returns empty object when settings missing', () => {
    expect(getBusinessZendeskIntegration()).toEqual({});
    expect(getBusinessZendeskIntegration({})).toEqual({});
  });

  it('returns empty object when integrations block missing', () => {
    expect(getBusinessZendeskIntegration({ locale: 'en' })).toEqual({});
  });

  it('reads zendesk integration from settings', () => {
    const settings = {
      integrations: {
        zendesk: {
          enabled: true,
          subdomain: 'acme',
          widgetKey: 'abc123',
          syncCustomersEnabled: true,
        },
      },
    };
    expect(getBusinessZendeskIntegration(settings)).toEqual({
      enabled: true,
      subdomain: 'acme',
      widgetKey: 'abc123',
      syncCustomersEnabled: true,
    });
  });
});
