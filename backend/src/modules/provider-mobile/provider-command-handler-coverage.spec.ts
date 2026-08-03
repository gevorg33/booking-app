import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PROVIDER_INTENTS } from '../ai/ai-command-registry.build.js';

/** ai-cmd-provider-6.14.3 — mirrors ai-command-handler-coverage.spec.ts (ai-cmd-ext-0.2)
 *  for the provider surface: every registry-declared provider intent must resolve
 *  to a literal `case '<id>':` in ProviderAiCommandService's dispatch switch,
 *  unless explicitly exempted below with a documented reason. */

const PROVIDER_META_INTENTS = new Set(['unknown', 'error', 'security_blocked']);

/** Handled via pre-switch alias/rescue logic, not a literal case in the switch. */
const ALIAS_HANDLED_PROVIDER_INTENTS = new Set([
  // Normalized to 'add_retail_to_booking' before the switch runs (ai-cmd-provider-6.6).
  'add_retail_to_my_booking',
  // Dispatched generically via isAppGuideIntent()/dispatchProviderAppGuideIntent
  // before the switch runs (ai-guide-1.8.6), not a literal case per id.
  'explain_app_feature',
  'guide_user_flow',
  'explain_current_screen',
]);

/** Registered in PROVIDER_EXCLUSIVE_INTENTS with no backing handler anywhere in the
 *  codebase (no logic function, no service method) — discovered by this gate in
 *  ai-cmd-provider-6.14. Deep, undeveloped gaps (resource/room scheduling and cash-
 *  collection concepts don't exist yet as domains) — tracked, not silently dropped. */
const KNOWN_UNWIRED_PROVIDER_INTENTS = new Set<string>([]);

const PROVIDER_AI_COMMAND_SOURCE = readFileSync(
  join(__dirname, 'provider-ai-command.service.ts'),
  'utf8',
);

function providerIntentsRequiringSwitchCase(): string[] {
  return PROVIDER_INTENTS.filter(
    (id) =>
      !PROVIDER_META_INTENTS.has(id) &&
      !ALIAS_HANDLED_PROVIDER_INTENTS.has(id) &&
      !KNOWN_UNWIRED_PROVIDER_INTENTS.has(id),
  );
}

describe('provider command handler coverage (ai-cmd-provider-6.14.3)', () => {
  it('maps every registry provider intent to a switch case in ProviderAiCommandService', () => {
    const required = providerIntentsRequiringSwitchCase();
    const missing = required.filter(
      (id) => !PROVIDER_AI_COMMAND_SOURCE.includes(`case '${id}':`),
    );

    expect(missing).toEqual([]);
  });

  it('does not let a wired intent linger in the known-unwired exception list', () => {
    const stillUnwired = [...KNOWN_UNWIRED_PROVIDER_INTENTS].filter(
      (id) => !PROVIDER_AI_COMMAND_SOURCE.includes(`case '${id}':`),
    );
    expect(stillUnwired.sort()).toEqual(
      [...KNOWN_UNWIRED_PROVIDER_INTENTS].sort(),
    );
  });

  it('keeps the alias-handled exception list honest (no literal case exists for it)', () => {
    const nowHasCase = [...ALIAS_HANDLED_PROVIDER_INTENTS].filter((id) =>
      PROVIDER_AI_COMMAND_SOURCE.includes(`case '${id}':`),
    );
    expect(nowHasCase).toEqual([]);
  });
});
