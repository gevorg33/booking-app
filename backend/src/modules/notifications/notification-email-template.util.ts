import { BadRequestException } from '@nestjs/common';
import type {
  NotificationEmailTemplateKey,
  NormalizedTenantEmailTemplatesSettings,
  RenderedEmail,
  ResolvedEmailTemplate,
  TenantCustomEmailVariable,
  TenantEmailTemplatesSettings,
} from './notification-email-template.types.js';
import { resolveLocale, type AppLocale } from '../../common/i18n/messages.js';
import {
  EMAIL_TEMPLATE_DEFINITIONS,
  resolveEmailTemplate,
} from './notification-email-template.defaults.js';

export { resolveEmailTemplate } from './notification-email-template.defaults.js';

const VARIABLE_KEY_PATTERN = /^[a-z][a-z0-9_]{0,47}$/;

export function readTenantEmailTemplatesSettings(
  settings?: Record<string, unknown>,
): NormalizedTenantEmailTemplatesSettings {
  const raw = settings?.emailTemplates;
  if (!raw || typeof raw !== 'object') return { customVariables: [], templates: {} };
  const obj = raw as TenantEmailTemplatesSettings;
  return {
    customVariables: Array.isArray(obj.customVariables) ? obj.customVariables : [],
    templates: obj.templates && typeof obj.templates === 'object' ? obj.templates : {},
  };
}

function settingsLocale(settings?: Record<string, unknown>): AppLocale {
  const raw = settings?.locale;
  return resolveLocale(typeof raw === 'string' ? raw : null);
}

export function listResolvedEmailTemplates(
  settings?: Record<string, unknown>,
): ResolvedEmailTemplate[] {
  const stored = readTenantEmailTemplatesSettings(settings);
  const locale = settingsLocale(settings);
  return EMAIL_TEMPLATE_DEFINITIONS.map((def) =>
    resolveEmailTemplate(def.key, stored.templates?.[def.key], locale),
  );
}

export function listAllTemplateVariables(
  settings?: Record<string, unknown>,
): Array<{ key: string; label: string; description: string; sampleValue: string; custom: boolean }> {
  const stored = readTenantEmailTemplatesSettings(settings);
  const builtin = new Map<
    string,
    { key: string; label: string; description: string; sampleValue: string; custom: boolean }
  >();
  for (const def of EMAIL_TEMPLATE_DEFINITIONS) {
    for (const variable of def.variables) {
      if (!builtin.has(variable.key)) {
        builtin.set(variable.key, { ...variable, custom: false });
      }
    }
  }
  for (const custom of stored.customVariables) {
    if (!custom.key?.trim()) continue;
    builtin.set(custom.key, {
      key: custom.key,
      label: custom.label || custom.key,
      description: 'Custom tenant variable',
      sampleValue: custom.defaultValue ?? '',
      custom: true,
    });
  }
  return [...builtin.values()];
}

export function assertValidCustomVariableKey(key: string): void {
  if (!VARIABLE_KEY_PATTERN.test(key)) {
    throw new BadRequestException(
      'Variable key must start with a letter and use lowercase letters, numbers, or underscores only',
    );
  }
}

export function renderTemplateString(
  template: string,
  variables: Record<string, string | undefined | null>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const value = variables[key];
    return value == null ? '' : String(value);
  });
}

export function renderBusinessEmailTemplate(
  settings: Record<string, unknown> | undefined,
  key: NotificationEmailTemplateKey,
  runtimeVariables: Record<string, string | undefined | null>,
): RenderedEmail | null {
  const stored = readTenantEmailTemplatesSettings(settings);
  const locale = settingsLocale(settings);
  const resolved = resolveEmailTemplate(key, stored.templates?.[key], locale);
  if (!resolved.enabled) return null;

  const variables: Record<string, string> = {};
  for (const custom of stored.customVariables) {
    if (custom.key) variables[custom.key] = custom.defaultValue ?? '';
  }
  for (const [k, v] of Object.entries(runtimeVariables)) {
    if (v != null) variables[k] = String(v);
  }

  return {
    subject: renderTemplateString(resolved.subject, variables),
    text: renderTemplateString(resolved.bodyText, variables),
    html: renderTemplateString(resolved.bodyHtml, variables),
  };
}

export function normalizeCustomVariables(
  variables: TenantCustomEmailVariable[],
): TenantCustomEmailVariable[] {
  const seen = new Set<string>();
  const result: TenantCustomEmailVariable[] = [];
  for (const variable of variables) {
    const key = variable.key?.trim();
    if (!key) continue;
    assertValidCustomVariableKey(key);
    if (seen.has(key)) {
      throw new BadRequestException(`Duplicate custom variable key: ${key}`);
    }
    seen.add(key);
    result.push({
      key,
      label: variable.label?.trim() || key,
      defaultValue: variable.defaultValue ?? '',
    });
  }
  return result;
}

export function assertBuiltinVariableKeyAvailable(
  key: string,
  settings?: Record<string, unknown>,
): void {
  const builtins = new Set<string>();
  for (const def of EMAIL_TEMPLATE_DEFINITIONS) {
    for (const variable of def.variables) builtins.add(variable.key);
  }
  if (builtins.has(key)) {
    throw new BadRequestException(`Variable key "${key}" is reserved by the system`);
  }
  const stored = readTenantEmailTemplatesSettings(settings);
  // ok if updating same key — service handles
  void stored;
}
