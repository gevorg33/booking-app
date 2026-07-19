import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { sparkles } from 'ionicons/icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { ProviderAiShell } from '../components/ProviderAiShell';
import { ProviderGuideStepList } from '../components/ProviderGuideStepList';
import { useI18n } from '../i18n';
import { providerMobileGuide } from '../lib/mobile-guide/index.ts';
import {
  buildProviderGuideListContext,
  buildProviderGuidePath,
  parseProviderGuideTopicId,
  providerGuideProfilePath,
  providerGuideTopicElementId,
  resolveProviderGuideLocale,
  resolveProviderGuideNavigateHref,
  sanitizeProviderGuideTopicId,
  scrollToProviderGuideTopic,
} from '../lib/provider-guide.util';
import { useProviderClinicNav } from '../lib/use-provider-clinic-nav';
import { fireProviderGuideAssistantSeed } from '../lib/provider-guide-assistant-seed.util';
import { useAuthStore } from '../services/auth-store';
import '../theme/provider-guide.css';

export default function GuidePage() {
  const history = useHistory();
  const location = useLocation();
  const { t, locale } = useI18n();
  const business = useAuthStore((s) => s.business);
  const clinicNav = useProviderClinicNav();
  const guideVisibility = useMemo(
    () => ({
      membershipRole: business?.membershipRole,
      labFeaturesEnabled: clinicNav.showClinicTabs,
    }),
    [business?.membershipRole, clinicNav.showClinicTabs],
  );
  const [activeTopicId, setActiveTopicId] = useState<string | null>(() =>
    sanitizeProviderGuideTopicId(parseProviderGuideTopicId(location.search), guideVisibility),
  );

  const guideLocale = resolveProviderGuideLocale(locale);
  const listContext = useMemo(
    () =>
      buildProviderGuideListContext({
        membershipRole: business?.membershipRole,
        labFeaturesEnabled: clinicNav.showClinicTabs,
      }),
    [business?.membershipRole, clinicNav.showClinicTabs],
  );

  const topics = useMemo(
    () =>
      providerMobileGuide
        .listGuideTopics(listContext)
        .map((playbook) => providerMobileGuide.resolveGuideFlowPlaybook(playbook, guideLocale)),
    [guideLocale, listContext],
  );

  const scrollToTopic = useCallback(
    (topicId: string, replaceUrl = true) => {
      setActiveTopicId(topicId);
      if (replaceUrl) {
        history.replace(buildProviderGuidePath({ topicId }));
      }
      window.requestAnimationFrame(() => {
        scrollToProviderGuideTopic(topicId);
      });
    },
    [history],
  );

  useEffect(() => {
    const rawTopicId = parseProviderGuideTopicId(location.search);
    const topicId = sanitizeProviderGuideTopicId(rawTopicId, guideVisibility);
    if (rawTopicId && !topicId) {
      history.replace(buildProviderGuidePath());
      setActiveTopicId(null);
      return;
    }
    if (!topicId || topics.length === 0) return;
    if (!topics.some((row) => row.topicId === topicId)) {
      history.replace(buildProviderGuidePath());
      setActiveTopicId(null);
      return;
    }
    setActiveTopicId(topicId);
    const timer = window.setTimeout(() => scrollToProviderGuideTopic(topicId), 80);
    return () => window.clearTimeout(timer);
  }, [guideVisibility, history, location.search, topics]);

  const profilePath = providerGuideProfilePath();

  // e2e-bug.69 — Guide is a standalone route outside ProviderTabChrome, so mount the
  // AI shell here; otherwise "Ask about this section" fires with no listener.
  return (
    <ProviderAiShell>
      <IonPage className="provider-guide-page">
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref={profilePath} text={t('provider.guidePageBack')} />
            </IonButtons>
            <IonTitle>{t('provider.guidePageTitle')}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <p className="provider-guide-section__summary">{t('provider.guidePageSubtitle')}</p>

          <nav className="provider-guide-toc" aria-label={t('provider.guidePageTopicsLabel')}>
            <p className="provider-guide-toc__label">{t('provider.guidePageTopicsLabel')}</p>
            {topics.map((topic) => (
              <button
                key={topic.topicId}
                type="button"
                className={
                  activeTopicId === topic.topicId
                    ? 'provider-guide-toc__link provider-guide-toc__link--active'
                    : 'provider-guide-toc__link'
                }
                onClick={() => scrollToTopic(topic.topicId)}
              >
                {topic.title}
              </button>
            ))}
          </nav>

          <div>
            {topics.map((topic) => (
              <section
                key={topic.topicId}
                id={providerGuideTopicElementId(topic.topicId)}
                className="provider-guide-section"
              >
                <h2 className="provider-guide-section__title">{topic.title}</h2>
                {topic.summary ? (
                  <p className="provider-guide-section__summary">{topic.summary}</p>
                ) : null}
                <ProviderGuideStepList steps={topic.steps} />
                <div className="provider-guide-section__actions">
                  <IonButton
                    size="small"
                    fill="clear"
                    className="provider-guide-section__ask"
                    onClick={() =>
                      fireProviderGuideAssistantSeed({
                        topicId: topic.topicId,
                        topicTitle: topic.title,
                        walkThroughTemplate: t('provider.guideWalkThroughTopic'),
                      })
                    }
                  >
                    <IonIcon icon={sparkles} slot="start" aria-hidden="true" />
                    {t('provider.guidePageAskSection')}
                  </IonButton>
                  {topic.navigateTarget ? (
                    <IonButton
                      size="small"
                      fill="outline"
                      onClick={() => {
                        const href = resolveProviderGuideNavigateHref(topic.navigateTarget!);
                        if (href) history.push(href);
                      }}
                    >
                      {t('provider.guidePageOpenInApp')}
                    </IonButton>
                  ) : null}
                </div>
              </section>
            ))}
          </div>
        </IonContent>
      </IonPage>
    </ProviderAiShell>
  );
}
