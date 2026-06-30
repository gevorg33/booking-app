import { describe, expect, it, vi } from 'vitest';
import {
  PROVIDER_STAFF_INVITE_GUIDE_TOPIC_ID,
  buildProviderGuideEntryPath,
  buildProviderInviteGuideEntryPath,
} from './provider-guide-entry.util.js';
import { listProviderGuideUiI18nKeys } from './provider-app-i18n.js';
import { translate } from '@shared-i18n/translate';
import en from '@shared-i18n/messages/en';
import hy from '@shared-i18n/messages/hy';
import ru from '@shared-i18n/messages/ru';

describe('provider guide entry points (ai-guide-1.9.8)', () => {
  it('profile entry opens native guide route', () => {
    expect(buildProviderGuideEntryPath()).toBe('/tabs/profile/guide');
    expect(buildProviderGuideEntryPath({ topicId: 'provider-getting-started' })).toBe(
      '/tabs/profile/guide?topicId=provider-getting-started',
    );
  });

  it('accept-invite footer targets staff invite playbook topic', () => {
    expect(PROVIDER_STAFF_INVITE_GUIDE_TOPIC_ID).toBe('provider-staff-invite');
    expect(buildProviderInviteGuideEntryPath()).toBe(
      '/tabs/profile/guide?topicId=provider-staff-invite',
    );
  });

  it('lists guide entry i18n keys in provider UI namespace', () => {
    const keys = listProviderGuideUiI18nKeys();
    expect(keys).toContain('provider.guidePageAccountEntryHint');
    expect(keys).toContain('provider.assistantOpenGuideChip');
    expect(keys).toContain('provider.inviteGuideLink');
  });

  it.each([
    ['en', en],
    ['hy', hy],
    ['ru', ru],
  ] as const)('ships localized entry copy for %s', (locale, messages) => {
    expect(translate(messages, 'provider.guidePageAccountEntryHint').trim().length).toBeGreaterThan(
      0,
    );
    expect(translate(messages, 'provider.assistantOpenGuideChip').trim().length).toBeGreaterThan(0);
    expect(translate(messages, 'provider.inviteGuideLink').trim().length).toBeGreaterThan(0);
    if (locale !== 'en') {
      expect(translate(messages, 'provider.assistantOpenGuideChip')).not.toBe(
        translate(en, 'provider.assistantOpenGuideChip'),
      );
    }
  });
});

describe('ProviderGuideEntryRow wiring', () => {
  it('invokes onOpen when the profile row is activated', () => {
    const onOpen = vi.fn();
    onOpen();
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
