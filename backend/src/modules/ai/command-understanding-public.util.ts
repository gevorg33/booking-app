import { buildPublicClassifierSchema } from '../public-booking/public-booking-classifier.schema.js';
import {
  localeLanguageInstruction,
  resolveLocale,
  type AppLocale,
} from '../../common/i18n/messages.js';
import { buildNarrowClassifierSchema } from './narrow-reclassify-schema.util.js';
import type { BuildPublicClassifierContextOpts } from './command-understanding-adapter.types.js';

/** Public booking classifier system context (pipe-1.12.4). */
export function buildPublicClassifierContext(
  opts: BuildPublicClassifierContextOpts,
): string {
  const locale = resolveLocale(opts.locale, 'en');
  const schemaHeader = opts.narrowShortlist?.length
    ? buildNarrowClassifierSchema('public', opts.narrowShortlist)
    : buildPublicClassifierSchema();
  const i18nBlock = opts.pipelineContext.classifierContext
    ? `\n${opts.pipelineContext.classifierContext}`
    : '';

  return [
    schemaHeader,
    localeLanguageInstruction(locale),
    opts.businessContextBlock,
    i18nBlock,
  ]
    .filter(Boolean)
    .join('\n\n')
    .trim();
}
