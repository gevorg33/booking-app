import type { AppLocale } from '../../common/i18n/messages.js';
import type { LocalizedNamesMap } from '../../common/i18n/service-localized-names.util.js';
import type { OpenAiGatewayService } from '../integrations/openai/openai-gateway.service.js';
import {
  mergeServiceLocalizedNames,
  missingServiceTranslationLocales,
  readExplicitServiceLocalizedNames,
} from './ai-catalog-service-localized-names.util.js';

export async function translateServiceLocalizedNames(
  openAi: OpenAiGatewayService,
  input: {
    businessId: string;
    userId?: string;
    serviceName: string;
    targetLocales: AppLocale[];
  },
): Promise<LocalizedNamesMap | undefined> {
  if (input.targetLocales.length === 0) return undefined;
  if (!(await openAi.isAvailableForBusiness(input.businessId)))
    return undefined;

  const result = await openAi.completeJson<Partial<Record<AppLocale, string>>>(
    {
      businessId: input.businessId,
      userId: input.userId,
      surface: 'dashboard',
      operation: 'translate_service_localized_names',
      actorType: 'owner',
    },
    'You translate beauty, salon, clinic, and spa service catalog titles. Return JSON only.',
    `Translate this service catalog title:\n"${input.serviceName}"\n\nReturn JSON with keys ${input.targetLocales.join(', ')} only. Each value is one natural customer-facing title in that language. Preserve meaning; do not add extra services or prices.`,
    { temperature: 0.2, maxTokens: 400 },
  );

  if (!result) return undefined;

  const map: LocalizedNamesMap = {};
  for (const locale of input.targetLocales) {
    const label = result[locale]?.trim();
    if (label) map[locale] = [label];
  }
  return Object.keys(map).length ? map : undefined;
}

export async function resolveCreateServiceLocalizedNames(
  openAi: OpenAiGatewayService,
  input: {
    businessId: string;
    userId?: string;
    serviceName: string;
    enabledLocales: readonly AppLocale[];
    prompt?: string;
    params?: Record<string, unknown>;
  },
): Promise<LocalizedNamesMap | undefined> {
  const explicit = readExplicitServiceLocalizedNames(
    input.params,
    input.prompt,
    input.enabledLocales,
  );
  const missing = missingServiceTranslationLocales(
    input.enabledLocales,
    explicit,
  );
  const generated = await translateServiceLocalizedNames(openAi, {
    businessId: input.businessId,
    userId: input.userId,
    serviceName: input.serviceName,
    targetLocales: missing,
  });
  return mergeServiceLocalizedNames(explicit, generated);
}
