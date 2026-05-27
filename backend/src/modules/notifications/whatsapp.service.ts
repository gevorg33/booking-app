import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { NotificationKind } from './notification.types.js';
import type { WhatsAppRuntimeConfig } from './whatsapp-integration.types.js';
import { WhatsAppIntegrationService } from './whatsapp-integration.service.js';

export interface WhatsAppBookingPayload {
  toPhone: string;
  kind: NotificationKind;
  customerName: string;
  businessName: string;
  serviceName: string;
  providerName: string;
  dateLabel: string;
  timeLabel: string;
  reminderLabel?: string;
}

interface TemplateSendOptions {
  name: string;
  language: string;
  bodyParams: string[];
}

@Injectable()
export class WhatsAppService implements OnModuleInit {
  private readonly logger = new Logger(WhatsAppService.name);
  private approvedTemplateKeysByAccount = new Map<string, Set<string>>();

  constructor(private integrationService: WhatsAppIntegrationService) {}

  get isConfigured(): boolean {
    return Boolean(this.integrationService.platformRuntimeConfig());
  }

  async onModuleInit(): Promise<void> {
    const platform = this.integrationService.platformRuntimeConfig();
    if (!platform) {
      this.logger.warn(
        'Platform WhatsApp not configured — new tenants need WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in .env',
      );
      return;
    }

    this.logger.log(
      `Platform WhatsApp default ready — phone id ${platform.phoneNumberId}, templates: ${platform.templateConfirmation} / ${platform.templateReminder} (${platform.templateLanguage})`,
    );

    await this.validateTemplatesOnStartup(platform);
  }

  /** E.164 digits only, no + (Meta Cloud API format). */
  normalizeRecipient(phone: string, defaultCountryCode: string): string | null {
    const countryCode = defaultCountryCode.replace(/\D/g, '');
    let digits = phone.replace(/\D/g, '');
    if (!digits) return null;

    if (digits.startsWith('0') && digits.length >= 9) {
      digits = countryCode + digits.slice(1);
    } else if (digits.length <= 9 && countryCode) {
      digits = countryCode + digits;
    }

    return digits.length >= 10 ? digits : null;
  }

  private accountCacheKey(config: WhatsAppRuntimeConfig): string {
    return config.wabaId || config.phoneNumberId;
  }

  private templateKey(name: string, language: string): string {
    return `${name}:${language}`;
  }

  private getApprovedKeys(config: WhatsAppRuntimeConfig): Set<string> {
    const key = this.accountCacheKey(config);
    return this.approvedTemplateKeysByAccount.get(key) ?? new Set();
  }

  isTemplateApproved(config: WhatsAppRuntimeConfig, name: string, language: string): boolean {
    return this.getApprovedKeys(config).has(this.templateKey(name, language));
  }

  /** Skip duplicate hello_world when both confirmation and reminder use fallback. */
  shouldSkipImmediateAfterConfirmation(config: WhatsAppRuntimeConfig): boolean {
    return (
      !this.isTemplateApproved(config, config.templateConfirmation, config.templateLanguage) &&
      !this.isTemplateApproved(config, config.templateReminder, config.templateLanguage)
    );
  }

  private async resolveTemplateSend(
    config: WhatsAppRuntimeConfig,
    templateName: string,
    templateLang: string,
    bodyParams: string[],
  ): Promise<TemplateSendOptions & { isFallback: boolean }> {
    await this.refreshApprovedTemplates(config);

    if (this.isTemplateApproved(config, templateName, templateLang)) {
      return { name: templateName, language: templateLang, bodyParams, isFallback: false };
    }

    const fallbackParams =
      config.fallbackBodyParamCount > 0
        ? bodyParams.slice(0, config.fallbackBodyParamCount)
        : [];

    this.logger.warn(
      `Template "${templateName}" (${templateLang}) not approved yet — using "${config.fallbackTemplate}" until Meta approves it`,
    );

    return {
      name: config.fallbackTemplate,
      language: config.fallbackLanguage,
      bodyParams: fallbackParams,
      isFallback: true,
    };
  }

  private formatTemplateValue(value: string): string {
    return value.replace(/\s+/g, ' ').trim().slice(0, 1024);
  }

  private async refreshApprovedTemplates(config: WhatsAppRuntimeConfig): Promise<void> {
    if (!config.wabaId || !config.accessToken) return;

    try {
      const url = `https://graph.facebook.com/${config.apiVersion}/${config.wabaId}/message_templates?fields=name,language,status&limit=100`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${config.accessToken}` },
      });
      if (!res.ok) return;

      const data = (await res.json()) as {
        data?: Array<{ name: string; language: string; status: string }>;
      };
      const approved = (data.data ?? []).filter((t) => t.status === 'APPROVED');
      this.approvedTemplateKeysByAccount.set(
        this.accountCacheKey(config),
        new Set(approved.map((t) => this.templateKey(t.name, t.language))),
      );
    } catch {
      // Non-fatal
    }
  }

  private async validateTemplatesOnStartup(config: WhatsAppRuntimeConfig): Promise<void> {
    if (!config.wabaId || !config.accessToken) return;

    try {
      const url = `https://graph.facebook.com/${config.apiVersion}/${config.wabaId}/message_templates?fields=name,language,status&limit=100`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${config.accessToken}` },
      });
      if (!res.ok) return;

      const data = (await res.json()) as {
        data?: Array<{ name: string; language: string; status: string }>;
      };
      const approved = (data.data ?? []).filter((t) => t.status === 'APPROVED');
      this.approvedTemplateKeysByAccount.set(
        this.accountCacheKey(config),
        new Set(approved.map((t) => this.templateKey(t.name, t.language))),
      );
      const names = approved.map((t) => `${t.name} (${t.language})`).join(', ') || 'none';
      this.logger.log(`WhatsApp approved templates (${config.source}): ${names}`);

      for (const required of [
        { name: config.templateConfirmation, language: config.templateLanguage },
        { name: config.templateReminder, language: config.templateLanguage },
      ]) {
        const found = approved.some(
          (t) => t.name === required.name && t.language === required.language,
        );
        if (!found) {
          this.logger.warn(
            `WhatsApp template "${required.name}" (${required.language}) is not approved yet — ` +
              `using "${config.fallbackTemplate}" until Meta approves it.`,
          );
        }
      }
    } catch {
      // Non-fatal — startup check only
    }
  }

  private async sendTemplate(
    config: WhatsAppRuntimeConfig,
    to: string,
    options: TemplateSendOptions,
    preview: string,
  ): Promise<{ ok: boolean; error?: string }> {
    const url = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`;
    const template: Record<string, unknown> = {
      name: options.name,
      language: { code: options.language },
    };
    if (options.bodyParams.length > 0) {
      template.components = [
        {
          type: 'body',
          parameters: options.bodyParams.map((text) => ({ type: 'text', text })),
        },
      ];
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: body || res.statusText };
    }

    this.logger.log(
      `WhatsApp sent (${config.source}, ${options.name}/${options.language}) → ${to}: ${preview}`,
    );
    return { ok: true };
  }

  async sendBookingMessage(
    payload: WhatsAppBookingPayload,
    config: WhatsAppRuntimeConfig,
  ): Promise<{ ok: boolean; error?: string }> {
    const to = this.normalizeRecipient(payload.toPhone, config.defaultCountryCode);
    if (!to) {
      return { ok: false, error: `Invalid phone number for WhatsApp: ${payload.toPhone}` };
    }

    const isConfirmation = payload.kind === 'confirmation';
    const templateName = isConfirmation ? config.templateConfirmation : config.templateReminder;
    const templateLang = config.templateLanguage;

    const allBodyParams = isConfirmation
      ? [
          payload.customerName,
          payload.serviceName,
          payload.businessName,
          `${payload.dateLabel} ${payload.timeLabel}`,
        ]
      : [
          payload.customerName,
          payload.businessName,
          payload.reminderLabel || 'soon',
        ];
    const paramCount = isConfirmation
      ? config.templateBodyParamCount
      : config.reminderBodyParamCount;
    const bodyParams =
      paramCount > 0
        ? allBodyParams.slice(0, paramCount).map((v) => this.formatTemplateValue(v))
        : [];

    const preview = isConfirmation
      ? `[confirmation] ${payload.businessName}: ${payload.serviceName} on ${payload.dateLabel} ${payload.timeLabel}`
      : `[reminder] ${payload.businessName}: ${payload.serviceName} in ${payload.reminderLabel}`;

    try {
      const resolved = await this.resolveTemplateSend(config, templateName, templateLang, bodyParams);
      const result = await this.sendTemplate(config, to, resolved, preview);

      if (!result.ok) {
        this.logger.warn(`WhatsApp API error to ${to}: ${result.error}`);
      } else if (resolved.isFallback) {
        this.logger.log(
          `WhatsApp delivered via fallback — personalized template will be used automatically once Meta approves "${templateName}"`,
        );
      }

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'WhatsApp send failed';
      return { ok: false, error: message };
    }
  }
}
