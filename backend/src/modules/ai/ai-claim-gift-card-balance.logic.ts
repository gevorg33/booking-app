import type { GiftCardClaimService } from '../gift-cards/gift-card-claim.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  buildClaimGiftCardBalanceNavigate,
  buildClaimGiftCardBalanceSignInNavigate,
  buildClaimGiftCardBalanceSummary,
  enrichClaimGiftCardBalanceParamsFromPrompt,
  isClaimGiftCardBalancePrompt,
  parseClaimGiftCardBalanceFromPrompt,
} from './ai-claim-gift-card-balance.util.js';

export interface ClaimGiftCardBalanceLogicDeps {
  giftCardClaimService: Pick<GiftCardClaimService, 'claimByCode'>;
}

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

export async function handleClaimGiftCardBalanceLogic(
  deps: ClaimGiftCardBalanceLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt = '',
): Promise<CommandResult> {
  const textPrompt = prompt || String(params._prompt ?? '');
  const enriched = enrichClaimGiftCardBalanceParamsFromPrompt(
    { ...params, _prompt: textPrompt },
    textPrompt,
  );

  if (textPrompt && !isClaimGiftCardBalancePrompt(textPrompt)) {
    return failure(
      'claim_gift_card_balance',
      'Say something like "Redeem gift card code GCM-ABCD1234" or "Add gift card to account".',
      { clarify: true },
    );
  }

  const parsed = parseClaimGiftCardBalanceFromPrompt(textPrompt, enriched);
  if (!parsed) {
    return failure(
      'claim_gift_card_balance',
      'Ask to redeem or add a gift card to your account.',
      { clarify: true },
    );
  }

  const giftCardCode = parsed.giftCardCode;
  const customerId = resolveSessionCustomerId(enriched);

  if (!customerId) {
    return failure('claim_gift_card_balance', 'Sign in to claim a gift card.', {
      clarify: true,
      missing: ['sessionCustomerId'],
      navigate: buildClaimGiftCardBalanceSignInNavigate(giftCardCode),
    });
  }

  if (!giftCardCode) {
    return success(
      'claim_gift_card_balance',
      buildClaimGiftCardBalanceSummary({}),
      {
        navigate: buildClaimGiftCardBalanceNavigate(),
        clarify: true,
        missing: ['giftCardCode'],
      },
    );
  }

  try {
    const claimResult = await deps.giftCardClaimService.claimByCode(
      businessId,
      giftCardCode,
      customerId,
    );
    return success(
      'claim_gift_card_balance',
      buildClaimGiftCardBalanceSummary({ giftCardCode, claimed: true }),
      {
        giftCardCode,
        claim: claimResult,
        navigate: buildClaimGiftCardBalanceNavigate(giftCardCode),
      },
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : 'Gift card could not be claimed on your account.';
    const monetaryCheckout =
      /monetary gift cards are redeemed at booking checkout/i.test(message);
    return failure('claim_gift_card_balance', message, {
      giftCardCode,
      monetaryCheckout,
      navigate: buildClaimGiftCardBalanceNavigate(giftCardCode),
    });
  }
}
