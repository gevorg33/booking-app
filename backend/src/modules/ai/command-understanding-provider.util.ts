import { todayDisplay } from '../../common/utils/date-format.util.js';
import {
  buildProviderClassifierAppendix,
  buildProviderSessionContextBlock,
} from '../provider-mobile/provider-ai-sprint22.util.js';
import type { BuildProviderClassifierContextOpts } from './command-understanding-adapter.types.js';

/** Provider mobile classifier system context (pipe-1.12.2). */
export function buildProviderClassifierContext(
  opts: BuildProviderClassifierContextOpts,
): string {
  const contextBlock = `Current date: ${todayDisplay()} (DD/MM/YYYY, times 24h HH:mm)
Logged-in user: ${opts.providerName}
View mode: ${opts.viewMode}${opts.viewMode === 'team' ? ' — manager/owner, all team appointments' : ' — own appointments only'}`;

  const intelligenceBlock = buildProviderClassifierAppendix(
    opts.sessionContext,
  );
  const sessionBlock = buildProviderSessionContextBlock(opts.sessionContext);
  const i18nBlock = opts.pipelineContext.classifierContext
    ? `\n${opts.pipelineContext.classifierContext}`
    : '';

  return `${contextBlock}${intelligenceBlock}${sessionBlock}${i18nBlock}`;
}
