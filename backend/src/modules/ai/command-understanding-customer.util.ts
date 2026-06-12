import { buildCustomerClassifierSchema } from './customer-ai-command.util.js';
import { buildNarrowClassifierSchema } from './narrow-reclassify-schema.util.js';
import type { BuildCustomerClassifierContextOpts } from './command-understanding-adapter.types.js';

/** Customer mobile classifier system context (pipe-1.12.3). */
export function buildCustomerClassifierContext(
  opts: BuildCustomerClassifierContextOpts,
): string {
  const capabilityHints = opts.sessionContext?._capabilityHints as
    | string
    | undefined;
  const schemaHeader = opts.narrowShortlist?.length
    ? buildNarrowClassifierSchema('customer', opts.narrowShortlist)
    : buildCustomerClassifierSchema();
  const i18nBlock = opts.pipelineContext.classifierContext
    ? `\n${opts.pipelineContext.classifierContext}`
    : '';

  return `${schemaHeader}\n\n${capabilityHints ?? ''}${i18nBlock}`.trim();
}
