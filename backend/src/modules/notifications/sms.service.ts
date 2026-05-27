import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly accountSid: string | undefined;
  private readonly authToken: string | undefined;
  private readonly fromNumber: string | undefined;

  constructor(private config: ConfigService) {
    this.accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID');
    this.authToken = this.config.get<string>('TWILIO_AUTH_TOKEN');
    this.fromNumber = this.config.get<string>('TWILIO_FROM_NUMBER');
  }

  get isConfigured(): boolean {
    return Boolean(this.accountSid && this.authToken && this.fromNumber);
  }

  async send(to: string, body: string): Promise<{ ok: boolean; error?: string }> {
    if (!this.isConfigured) {
      this.logger.warn(`[dev] SMS to ${to}: ${body}`);
      return { ok: true };
    }

    const normalized = to.replace(/\D/g, '');
    if (!normalized) {
      return { ok: false, error: 'Invalid phone number' };
    }

    const toE164 = to.startsWith('+') ? to : `+${normalized}`;

    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
      const form = new URLSearchParams({
        To: toE164,
        From: this.fromNumber!,
        Body: body,
      });

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: form.toString(),
      });

      if (!res.ok) {
        const errBody = await res.text();
        return { ok: false, error: errBody || res.statusText };
      }

      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'SMS send failed';
      return { ok: false, error: message };
    }
  }
}
