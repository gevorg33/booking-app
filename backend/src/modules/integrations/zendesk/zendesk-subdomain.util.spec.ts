import { normalizeZendeskSubdomain } from './zendesk-subdomain.util.js';

describe('normalizeZendeskSubdomain', () => {
  it('returns plain subdomain unchanged', () => {
    expect(normalizeZendeskSubdomain('Acme')).toBe('acme');
  });

  it('strips zendesk.com suffix', () => {
    expect(normalizeZendeskSubdomain('acme.zendesk.com')).toBe('acme');
  });

  it('strips https URL prefix and path', () => {
    expect(normalizeZendeskSubdomain('https://acme.zendesk.com/agent/')).toBe(
      'acme',
    );
  });
});
