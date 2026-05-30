import { Injectable, Logger } from '@nestjs/common';

export interface ZendeskRuntimeConfig {
  subdomain: string;
  apiToken: string;
}

export interface ZendeskTicketResult {
  ticketId: number;
  url: string;
}

export interface ZendeskUserResult {
  userId: number;
  url: string;
  created: boolean;
}

@Injectable()
export class ZendeskApiClient {
  private readonly logger = new Logger(ZendeskApiClient.name);

  private baseUrl(subdomain: string): string {
    return `https://${subdomain}.zendesk.com/api/v2`;
  }

  private authHeader(apiToken: string): string {
    const encoded = Buffer.from(`token:${apiToken}`).toString('base64');
    return `Basic ${encoded}`;
  }

  async verifyCredentials(config: ZendeskRuntimeConfig): Promise<boolean> {
    const res = await fetch(`${this.baseUrl(config.subdomain)}/users/me.json`, {
      headers: {
        Authorization: this.authHeader(config.apiToken),
        'Content-Type': 'application/json',
      },
    });
    return res.ok;
  }

  async createTicket(
    config: ZendeskRuntimeConfig,
    payload: {
      subject: string;
      body: string;
      requesterEmail: string;
      requesterName?: string;
      tags?: string[];
      customFields?: Record<string, string>;
    },
  ): Promise<ZendeskTicketResult> {
    const commentBody = [
      payload.body,
      payload.customFields && Object.keys(payload.customFields).length
        ? `\n\n---\n${Object.entries(payload.customFields)
            .map(([k, v]) => `${k}: ${v}`)
            .join('\n')}`
        : '',
    ].join('');

    const res = await fetch(`${this.baseUrl(config.subdomain)}/tickets.json`, {
      method: 'POST',
      headers: {
        Authorization: this.authHeader(config.apiToken),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ticket: {
          subject: payload.subject,
          comment: { body: commentBody },
          requester: {
            email: payload.requesterEmail,
            name: payload.requesterName || payload.requesterEmail,
          },
          tags: payload.tags ?? ['optischedule'],
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      this.logger.warn(`Zendesk create ticket failed: ${res.status} ${text}`);
      throw new Error(`Zendesk API error (${res.status})`);
    }

    const data = (await res.json()) as { ticket: { id: number } };
    return {
      ticketId: data.ticket.id,
      url: `https://${config.subdomain}.zendesk.com/agent/tickets/${data.ticket.id}`,
    };
  }

  async upsertUser(
    config: ZendeskRuntimeConfig,
    payload: {
      email: string;
      name: string;
      phone?: string | null;
      externalId?: string;
      notes?: string;
    },
  ): Promise<ZendeskUserResult> {
    const res = await fetch(`${this.baseUrl(config.subdomain)}/users/create_or_update.json`, {
      method: 'POST',
      headers: {
        Authorization: this.authHeader(config.apiToken),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: {
          email: payload.email,
          name: payload.name,
          phone: payload.phone || undefined,
          external_id: payload.externalId,
          notes: payload.notes,
          verified: true,
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      this.logger.warn(`Zendesk upsert user failed: ${res.status} ${text}`);
      throw new Error(`Zendesk API error (${res.status})`);
    }

    const data = (await res.json()) as { user: { id: number; created_at: string } };
    return {
      userId: data.user.id,
      url: `https://${config.subdomain}.zendesk.com/agent/users/${data.user.id}`,
      created: Boolean(data.user.created_at),
    };
  }
}
