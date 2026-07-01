import {
  N99_PUSH_DELIVERABILITY_ERROR_SCENARIOS,
  N99_PUSH_SILENT_FAILURE_SCENARIOS,
  N99_PUSH_TOKEN_REFRESH_SCENARIOS,
} from './n99-push-deliverability.fixtures.js';
import {
  classifyFcmDeliveryError,
  detectSilentDeliveryFailure,
  resolveSilentFailureCandidates,
  shouldInvalidatePushToken,
  shouldRefreshConsumerPushToken,
} from './n99-push-deliverability.util.js';

describe('n99-push-deliverability.util', () => {
  it.each(N99_PUSH_DELIVERABILITY_ERROR_SCENARIOS)(
    'classifies $id',
    ({ code, action, provider }) => {
      const classification = classifyFcmDeliveryError(code);
      expect(classification.action).toBe(action);
      expect(classification.provider).toBe(provider);
      expect(shouldInvalidatePushToken(classification)).toBe(
        action === 'invalidate_token',
      );
    },
  );

  it.each(N99_PUSH_TOKEN_REFRESH_SCENARIOS)(
    'token refresh scenario $id',
    ({ previous, next, shouldRefresh }) => {
      expect(shouldRefreshConsumerPushToken(previous, next)).toBe(
        shouldRefresh,
      );
    },
  );

  it.each(N99_PUSH_SILENT_FAILURE_SCENARIOS)(
    'silent failure scenario $id',
    ({ lastFcmAcceptedAt, lastDeliveryAckAt, now, isSilentFailure }) => {
      expect(
        detectSilentDeliveryFailure({
          lastFcmAcceptedAt,
          lastDeliveryAckAt,
          now,
        }),
      ).toBe(isSilentFailure);
    },
  );

  it('does not re-flag silent failures already recorded for the same accept', () => {
    expect(
      detectSilentDeliveryFailure({
        lastFcmAcceptedAt: '2026-06-07T10:00:00.000Z',
        lastDeliveryAckAt: null,
        lastSilentFailureAt: '2026-06-08T11:00:00.000Z',
        now: '2026-06-09T12:00:00.000Z',
      }),
    ).toBe(false);
  });

  it('resolves silent failure candidates for pending acks', () => {
    const ids = resolveSilentFailureCandidates(
      [
        {
          id: 'tok-ok',
          lastFcmAcceptedAt: new Date('2026-06-08T10:00:00.000Z'),
          lastDeliveryAckAt: new Date('2026-06-08T10:00:05.000Z'),
        },
        {
          id: 'tok-silent',
          lastFcmAcceptedAt: new Date('2026-06-07T10:00:00.000Z'),
          lastDeliveryAckAt: null,
        },
      ],
      new Date('2026-06-08T11:00:00.000Z'),
    );
    expect(ids).toEqual(['tok-silent']);
  });
});
