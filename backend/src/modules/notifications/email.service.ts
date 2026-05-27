import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly apiKey: string | undefined;
  private readonly fromEmail: string;

  constructor(private config: ConfigService) {
    this.apiKey = this.config.get<string>('RESEND_API_KEY');
    this.fromEmail =
      this.config.get<string>('NOTIFICATION_FROM_EMAIL') || 'onboarding@resend.dev';
  }

  get isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async send(params: SendEmailParams): Promise<{ ok: boolean; error?: string }> {
    if (!this.apiKey) {
      this.logger.warn(
        `[dev] Email to ${params.to} — ${params.subject}\n${params.text || params.html}`,
      );
      return { ok: true };
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: [params.to],
          subject: params.subject,
          html: params.html,
          text: params.text,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        return { ok: false, error: body || res.statusText };
      }

      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Email send failed';
      return { ok: false, error: message };
    }
  }
}
