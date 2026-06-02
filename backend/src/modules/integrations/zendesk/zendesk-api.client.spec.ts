import { ZendeskApiClient } from './zendesk-api.client.js';

describe('ZendeskApiClient', () => {
  const client = new ZendeskApiClient();
  const config = { subdomain: 'acme', apiUserEmail: 'agent@test.com', apiToken: 'secret-token' };

  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('verifyCredentials returns true when API responds ok', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
    await expect(client.verifyCredentials(config)).resolves.toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://acme.zendesk.com/api/v2/users/me.json',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Basic ${Buffer.from('agent@test.com/token:secret-token').toString('base64')}`,
        }),
      }),
    );
  });

  it('verifyCredentials returns false when API fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false });
    await expect(client.verifyCredentials(config)).resolves.toBe(false);
  });

  it('createTicket returns ticket id and agent url', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ticket: { id: 42 } }),
    });

    const result = await client.createTicket(config, {
      subject: 'Help',
      body: 'Need assistance',
      requesterEmail: 'user@example.com',
      requesterName: 'User',
      tags: ['test'],
      customFields: { Business: 'Acme' },
    });

    expect(result).toEqual({
      ticketId: 42,
      url: 'https://acme.zendesk.com/agent/tickets/42',
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.ticket.subject).toBe('Help');
    expect(body.ticket.comment.body).toContain('Need assistance');
    expect(body.ticket.comment.body).toContain('Business: Acme');
    expect(body.ticket.requester.email).toBe('user@example.com');
    expect(body.ticket.requester.name).toBe('User');
  });

  it('createTicket works without custom fields and uses email as name fallback', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ticket: { id: 1 } }),
    });

    await client.createTicket(config, {
      subject: 'Help',
      body: 'Plain body',
      requesterEmail: 'user@example.com',
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.ticket.comment.body).toBe('Plain body');
    expect(body.ticket.tags).toEqual(['optischedule']);
    expect(body.ticket.requester.name).toBe('user@example.com');
  });

  it('createTicket throws when API returns error', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 422,
      text: async () => 'validation failed',
    });

    await expect(
      client.createTicket(config, {
        subject: 'Help',
        body: 'Body',
        requesterEmail: 'user@example.com',
      }),
    ).rejects.toThrow('Zendesk API error (422)');
  });

  it('upsertUser returns user metadata', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ user: { id: 7, created_at: '2024-01-01T00:00:00Z' } }),
    });

    const result = await client.upsertUser(config, {
      email: 'cust@example.com',
      name: 'Customer',
      phone: '+15551234567',
      externalId: 'cust-1',
      notes: 'VIP',
    });

    expect(result).toEqual({
      userId: 7,
      url: 'https://acme.zendesk.com/agent/users/7',
      created: true,
    });
  });

  it('upsertUser omits phone when null', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ user: { id: 8, created_at: '' } }),
    });

    const result = await client.upsertUser(config, {
      email: 'cust@example.com',
      name: 'Customer',
      phone: null,
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.user.phone).toBeUndefined();
    expect(result.created).toBe(false);
  });

  it('upsertUser throws when API returns error', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'unauthorized',
    });

    await expect(
      client.upsertUser(config, {
        email: 'cust@example.com',
        name: 'Customer',
      }),
    ).rejects.toThrow('Zendesk API error (401)');
  });
});
