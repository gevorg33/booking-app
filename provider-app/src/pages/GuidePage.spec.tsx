import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import GuidePage from './GuidePage';
import { providerMobileGuide } from '../lib/mobile-guide/index.ts';
import {
  PROVIDER_CLINIC_GUIDE_TOPIC_ID,
  PROVIDER_TEAM_MANAGER_GUIDE_TOPIC_ID,
  providerGuideTopicElementId,
} from '../lib/provider-guide.util';

const replace = vi.fn();
const push = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useHistory: () => ({ replace, push }),
  };
});

let clinicNav = {
  showClinicTabs: false,
  showLabCollection: false,
  showLabResults: false,
  showClinicTasks: false,
  showPatients: false,
};

let business: { id: string; membershipRole: string } | null = {
  id: 'biz-1',
  membershipRole: 'provider',
};

vi.mock('../lib/use-provider-clinic-nav', () => ({
  useProviderClinicNav: () => clinicNav,
}));

vi.mock('../services/auth-store', () => ({
  useAuthStore: (selector: (state: { business: typeof business }) => unknown) =>
    selector({ business }),
}));

const fireProviderGuideAssistantSeed = vi.fn();

vi.mock('../lib/provider-guide-assistant-seed.util', () => ({
  fireProviderGuideAssistantSeed: (...args: unknown[]) =>
    fireProviderGuideAssistantSeed(...args),
}));

// e2e-bug.69 — GuidePage mounts ProviderAiShell; stub the heavy assistant leaf.
vi.mock('../components/ProviderAiAssistant', () => ({
  default: () => <div data-testid="provider-ai-assistant" />,
}));

vi.mock('../i18n', () => ({
  useI18n: () => ({
    locale: 'en',
    t: (key: string) => {
      const labels: Record<string, string> = {
        'provider.guidePageTitle': 'Help & guide',
        'provider.guidePageSubtitle':
          'Step-by-step help for Today, Calendar, Schedule, appointments, and your profile.',
        'provider.guidePageTopicsLabel': 'Topics',
        'provider.guidePageBack': 'Back',
        'provider.guidePageOpenInApp': 'Open in app',
        'provider.guidePageAskSection': 'Ask about this section',
        'provider.guideWalkThroughTopic': 'Walk me through {topic}',
      };
      return labels[key] ?? key;
    },
  }),
}));

function topicTitle(
  topicId: string,
  opts?: { vertical?: string; roleProfile?: 'owner' | 'provider' | 'manager' },
): string {
  return (
    providerMobileGuide.resolveGuidePlaybook(topicId, 'en', {
      surface: 'provider',
      roleProfile: opts?.roleProfile ?? 'provider',
      vertical: opts?.vertical,
    })?.title ?? topicId
  );
}

describe('GuidePage (ai-guide-1.9.14)', () => {
  let container: HTMLDivElement;
  let root: Root;
  let scrollIntoView: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    business = { id: 'biz-1', membershipRole: 'provider' };
    clinicNav = {
      showClinicTabs: false,
      showLabCollection: false,
      showLabResults: false,
      showClinicTasks: false,
      showPatients: false,
    };
    replace.mockReset();
    push.mockReset();
    fireProviderGuideAssistantSeed.mockReset();
    scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  function render(initialPath: string) {
    act(() => {
      root.render(
        <MemoryRouter initialEntries={[initialPath]}>
          <Route path="/tabs/profile/guide">
            <GuidePage />
          </Route>
        </MemoryRouter>,
      );
    });
  }

  async function flushEffects(ms = 120) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, ms));
    });
  }

  it('renders guide TOC and section anchors', async () => {
    render('/tabs/profile/guide');

    await flushEffects();

    expect(container.textContent).toContain('Help & guide');
    expect(container.textContent).toContain('Topics');
    expect(container.querySelector('.provider-guide-toc')).toBeTruthy();
    expect(container.querySelector('#guide-topic-provider-getting-started')).toBeTruthy();
  });

  it('activates topicId from query and scrolls to the section', async () => {
    render('/tabs/profile/guide?topicId=provider-getting-started');

    await flushEffects();

    const active = container.querySelector('.provider-guide-toc__link--active');
    expect(active?.textContent).toMatch(/provider app/i);
    expect(scrollIntoView).toHaveBeenCalled();
    expect(
      document.getElementById(providerGuideTopicElementId('provider-getting-started')),
    ).toBeTruthy();
  });

  it('filters team-manager topic for staff roles', async () => {
    render('/tabs/profile/guide');

    await flushEffects();

    const teamManagerTitle = topicTitle(PROVIDER_TEAM_MANAGER_GUIDE_TOPIC_ID, {
      roleProfile: 'owner',
    });
    expect(
      container.querySelector(
        `#${providerGuideTopicElementId(PROVIDER_TEAM_MANAGER_GUIDE_TOPIC_ID)}`,
      ),
    ).toBeNull();

    const tocLabels = Array.from(container.querySelectorAll('.provider-guide-toc__link')).map(
      (button) => button.textContent?.trim(),
    );
    expect(tocLabels).not.toContain(teamManagerTitle);
  });

  it('shows team-manager topic for owner role', async () => {
    business = { id: 'biz-1', membershipRole: 'owner' };
    render('/tabs/profile/guide');

    await flushEffects();

    const teamManagerTitle = topicTitle(PROVIDER_TEAM_MANAGER_GUIDE_TOPIC_ID, {
      roleProfile: 'owner',
    });
    expect(
      container.querySelector(
        `#${providerGuideTopicElementId(PROVIDER_TEAM_MANAGER_GUIDE_TOPIC_ID)}`,
      ),
    ).toBeTruthy();

    const tocLabels = Array.from(container.querySelectorAll('.provider-guide-toc__link')).map(
      (button) => button.textContent?.trim(),
    );
    expect(tocLabels).toContain(teamManagerTitle);
  });

  it('hides clinic guide topic when clinic nav is off', async () => {
    render('/tabs/profile/guide');

    await flushEffects();

    expect(container.textContent).not.toContain(
      topicTitle(PROVIDER_CLINIC_GUIDE_TOPIC_ID, { vertical: 'clinic' }),
    );
  });

  it('shows clinic guide topic when clinic nav is enabled', async () => {
    clinicNav = {
      showClinicTabs: true,
      showLabCollection: true,
      showLabResults: true,
      showClinicTasks: true,
      showPatients: true,
    };
    render('/tabs/profile/guide');

    await flushEffects();

    expect(container.textContent).toContain(
      topicTitle(PROVIDER_CLINIC_GUIDE_TOPIC_ID, { vertical: 'clinic' }),
    );
    expect(
      container.querySelector(`#${providerGuideTopicElementId(PROVIDER_CLINIC_GUIDE_TOPIC_ID)}`),
    ).toBeTruthy();
  });

  it('strips hidden team-manager topicId deep links for staff', async () => {
    render(`/tabs/profile/guide?topicId=${PROVIDER_TEAM_MANAGER_GUIDE_TOPIC_ID}`);

    await flushEffects();

    expect(replace).toHaveBeenCalledWith('/tabs/profile/guide');
    expect(container.querySelector('.provider-guide-toc__link--active')).toBeNull();
  });

  it('seeds assistant from ask-about-section CTA with topicId', async () => {
    render('/tabs/profile/guide');

    await flushEffects();

    const section = container.querySelector('#guide-topic-provider-getting-started');
    const askButton = section?.querySelector('.provider-guide-section__ask');
    expect(askButton).toBeTruthy();

    await act(async () => {
      askButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(fireProviderGuideAssistantSeed).toHaveBeenCalledWith({
      topicId: 'provider-getting-started',
      topicTitle: expect.stringMatching(/provider app/i),
      walkThroughTemplate: 'Walk me through {topic}',
    });
  });

  it('mounts ProviderAiShell assistant so ask-about-section has a listener (e2e-bug.69)', async () => {
    render('/tabs/profile/guide');

    await flushEffects();

    expect(container.querySelector('[data-testid="provider-ai-assistant"]')).toBeTruthy();
  });

  it('does not mount assistant when business is missing (e2e-bug.69)', async () => {
    business = null;
    render('/tabs/profile/guide');

    await flushEffects();

    expect(container.querySelector('[data-testid="provider-ai-assistant"]')).toBeNull();
  });
});
