import type { CommandResult } from './command-completion.types.js';
import {
  buildExplainWhySignInNavigate,
  buildExplainWhySignInSummary,
  enrichExplainWhySignInParamsFromPrompt,
  isExplainWhySignInPrompt,
  parseExplainWhySignInFromPrompt,
} from './ai-explain-why-sign-in.util.js';

function failure(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: false, action, summary, details: details ?? {} };
}

function success(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: true, action, summary, details: details ?? {} };
}

function resolveSessionCustomerId(
  params: Record<string, unknown>,
): string | undefined {
  const raw = params.sessionCustomerId ?? params.customerId;
  return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined;
}

export async function handleExplainWhySignInLogic(
  _businessId: string,
  params: Record<string, unknown> = {},
  prompt = '',
): Promise<CommandResult> {
  const textPrompt = prompt || String(params._prompt ?? '');
  const enriched = enrichExplainWhySignInParamsFromPrompt(
    { ...params, _prompt: textPrompt },
    textPrompt,
  );

  if (textPrompt && !isExplainWhySignInPrompt(textPrompt)) {
    return failure(
      'explain_why_sign_in',
      'Ask whether you need an account, what signing in gives you, or how guest checkout compares.',
      { clarify: true },
    );
  }

  const parsed = parseExplainWhySignInFromPrompt(textPrompt, enriched);
  if (!parsed) {
    return failure(
      'explain_why_sign_in',
      'Ask whether you need an account or what the benefit of signing in is.',
      { clarify: true },
    );
  }

  const signedIn = Boolean(resolveSessionCustomerId(enriched));
  const summary = buildExplainWhySignInSummary({
    aspect: parsed.aspect,
    signedIn,
  });
  const navigate = buildExplainWhySignInNavigate(parsed.aspect, signedIn);

  return success('explain_why_sign_in', summary, {
    aspect: parsed.aspect,
    signedIn,
    ...(navigate ? { navigate } : {}),
  });
}
