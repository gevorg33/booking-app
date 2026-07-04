import type { CommandResult } from './command-completion.types.js';
import {
  buildSignInWithProviderResult,
  providerForSignInAction,
  type SignInWithProviderIntent,
} from './ai-sign-in-with-provider.util.js';

function resolveSessionCustomerId(
  params: Record<string, unknown>,
): string | undefined {
  const raw = params.sessionCustomerId ?? params.customerId;
  return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined;
}

export async function handleSignInWithProviderLogic(
  action: SignInWithProviderIntent,
  _businessId: string,
  params: Record<string, unknown> = {},
): Promise<CommandResult> {
  const provider = providerForSignInAction(action);
  const alreadySignedIn = Boolean(resolveSessionCustomerId(params));
  const { summary, navigate } = buildSignInWithProviderResult(
    provider,
    alreadySignedIn,
  );

  return {
    success: true,
    action,
    summary,
    details: { provider, alreadySignedIn, navigate },
  };
}
