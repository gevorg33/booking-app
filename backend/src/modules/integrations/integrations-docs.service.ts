import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebhooksService } from './webhooks.service.js';

export interface IntegrationQuickStartStep {
  title: string;
  detail: string;
}

export interface IntegrationApiDocs {
  baseUrl: string;
  authentication: {
    type: string;
    header: string;
    alternateHeader: string;
  };
  publicBookingApi: {
    description: string;
    endpoints: Array<{ method: string; path: string; description: string }>;
  };
  businessApi: {
    description: string;
    endpoints: Array<{ method: string; path: string; description: string }>;
  };
  webhooks: {
    description: string;
    events: readonly string[];
    signatureHeader: string;
    signatureAlgorithm: string;
    verifyExample: string;
  };
  quickStart: {
    apiKey: IntegrationQuickStartStep[];
    webhook: IntegrationQuickStartStep[];
    zapier: IntegrationQuickStartStep[];
  };
  examples: {
    listBookingsCurl: string;
    webhookTestCurl: string;
  };
}

@Injectable()
export class IntegrationsDocsService {
  constructor(
    private config: ConfigService,
    private webhooksService: WebhooksService,
  ) {}

  buildDocs(businessId: string): IntegrationApiDocs {
    const baseUrl = this.config.get<string>('API_PUBLIC_URL') || 'http://localhost:3001';
    const events = this.webhooksService.getEventOptions().events;

    return {
      baseUrl,
      authentication: {
        type: 'api_key',
        header: 'Authorization: Bearer osk_live_…',
        alternateHeader: 'X-Api-Key: osk_live_…',
      },
      publicBookingApi: {
        description: 'No API key required — scoped by business slug',
        endpoints: [
          { method: 'GET', path: '/public/:slug', description: 'Business profile' },
          { method: 'GET', path: '/public/:slug/services', description: 'List bookable services' },
          { method: 'GET', path: '/public/:slug/providers', description: 'List providers for a date' },
          { method: 'GET', path: '/public/:slug/providers/:employeeId/slots', description: 'Available time slots' },
          { method: 'POST', path: '/public/:slug/bookings', description: 'Create a booking' },
          { method: 'POST', path: '/public/:slug/bookings/checkout', description: 'Start Stripe prepay checkout' },
        ],
      },
      businessApi: {
        description: 'Requires API key created in Integrations settings',
        endpoints: [
          { method: 'GET', path: '/v1/bookings', description: 'List bookings (optional ?date=, ?employeeId=)' },
          { method: 'GET', path: '/v1/bookings/:id', description: 'Get booking by ID' },
          { method: 'GET', path: '/v1/customers', description: 'List customers' },
          { method: 'GET', path: '/v1/services', description: 'List services' },
        ],
      },
      webhooks: {
        description: 'Outbound HTTP POST with HMAC-SHA256 signature in X-OptiSchedule-Signature',
        events,
        signatureHeader: 'X-OptiSchedule-Signature',
        signatureAlgorithm: 'HMAC-SHA256 hex digest of raw JSON body',
        verifyExample: `const crypto = require('crypto');
const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
if (req.headers['x-optischedule-signature'] !== expected) throw new Error('Invalid signature');`,
      },
      quickStart: {
        apiKey: [
          { title: 'Create API key', detail: 'Integrations → API keys → scopes: read:bookings, read:customers' },
          { title: 'Test', detail: `curl -H "Authorization: Bearer osk_live_…" ${baseUrl}/v1/bookings` },
        ],
        webhook: [
          { title: 'Add webhook URL', detail: 'Integrations → Webhooks → select events (booking.created, payment.received, review.received)' },
          { title: 'Save secret', detail: 'Copy the signing secret once — used to verify X-OptiSchedule-Signature' },
          { title: 'Send test booking', detail: 'Create a booking in dashboard; check Webhook deliveries tab' },
        ],
        zapier: [
          { title: 'Catch Hook', detail: 'Zapier → Webhooks by Zapier → Catch Hook → paste OptiSchedule webhook URL' },
          { title: 'Subscribe', detail: 'Enable booking.created, booking.cancelled, payment.received, review.received on the webhook' },
          { title: 'Poll API', detail: `GET ${baseUrl}/v1/bookings with your API key for backfill` },
        ],
      },
      examples: {
        listBookingsCurl: `curl -s -H "Authorization: Bearer osk_live_YOUR_KEY" "${baseUrl}/v1/bookings?date=2026-05-01"`,
        webhookTestCurl: `curl -s -X POST "${baseUrl}/businesses/${businessId}/integrations/webhooks" -H "Authorization: Bearer JWT" -H "Content-Type: application/json" -d '{"url":"https://hooks.example.com/os","events":["booking.created"]}'`,
      },
    };
  }
}
