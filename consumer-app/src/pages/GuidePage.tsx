import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { sparkles } from 'ionicons/icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { ConsumerGuideStepList } from '../components/ConsumerGuideStepList.js';
import { useConsumerCopy } from '../hooks/use-consumer-copy.js';
import { useTenantBootstrap } from '../hooks/use-tenant-bootstrap.js';
import { consumerMobileGuide } from '../lib/mobile-guide/index.ts';
import {
  buildConsumerGuideListContext,
  buildConsumerGuidePath,
  parseConsumerGuideTopicId,
  resolveConsumerGuideLocale,
  resolveConsumerGuideNavigateHref,
  sanitizeConsumerGuideTopicId,
  scrollToConsumerGuideTopic,
  consumerGuideTopicElementId,
} from '../lib/consumer-guide.util.js';
import { buildSalonPath } from '../lib/deep-link.js';
import { fireConsumerGuideAssistantSeed } from '../lib/consumer-guide-assistant-seed.util.js';
import '../theme/consumer-guide.css';

export default function GuidePage() {
  const history = useHistory();
  const location = useLocation();
  const { slug, profile, loading, error } = useTenantBootstrap();
  const { copy, locale } = useConsumerCopy(slug ?? '', profile ?? { locale: 'en' });
  const [activeTopicId, setActiveTopicId] = useState<string | null>(() =>
    sanitizeConsumerGuideTopicId(
      parseConsumerGuideTopicId(location.search),
      profile?.businessType,
    ),
  );

  const guideLocale = resolveConsumerGuideLocale(locale);
  const listContext = useMemo(
    () => buildConsumerGuideListContext(profile),
    [profile],
  );

  const topics = useMemo(() => {
    if (!profile) return [];
    return consumerMobileGuide
      .listGuideTopics(listContext)
      .map((playbook) => consumerMobileGuide.resolveGuideFlowPlaybook(playbook, guideLocale));
  }, [guideLocale, listContext, profile]);

  const scrollToTopic = useCallback(
    (topicId: string, replaceUrl = true) => {
      setActiveTopicId(topicId);
      if (slug && replaceUrl) {
        history.replace(buildConsumerGuidePath(slug, { topicId }));
      }
      window.requestAnimationFrame(() => {
        scrollToConsumerGuideTopic(topicId);
      });
    },
    [history, slug],
  );

  useEffect(() => {
    if (!profile || !slug) return;
    const rawTopicId = parseConsumerGuideTopicId(location.search);
    const topicId = sanitizeConsumerGuideTopicId(rawTopicId, profile.businessType);
    if (rawTopicId && !topicId) {
      history.replace(buildConsumerGuidePath(slug));
      setActiveTopicId(null);
      return;
    }
    if (!topicId || topics.length === 0) return;
    setActiveTopicId(topicId);
    const timer = window.setTimeout(() => scrollToConsumerGuideTopic(topicId), 80);
    return () => window.clearTimeout(timer);
  }, [history, location.search, profile, slug, topics.length]);

  if (loading) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <IonSpinner name="crescent" style={{ marginTop: '40vh' }} />
        </IonContent>
      </IonPage>
    );
  }

  if (error || !profile || !slug) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <p>{error || copy.guidePageLoadError}</p>
        </IonContent>
      </IonPage>
    );
  }

  const primaryColor = profile.branding.primaryColor;
  const accountPath = buildSalonPath(slug, '/account');

  return (
    <IonPage className="consumer-guide-page">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref={accountPath} text={copy.guidePageBack} />
          </IonButtons>
          <IonTitle>{copy.guidePageTitle}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <p className="consumer-guide-section__summary">{copy.guidePageSubtitle}</p>

        <nav className="consumer-guide-toc" aria-label={copy.guidePageTopicsLabel}>
          <p className="consumer-guide-toc__label">{copy.guidePageTopicsLabel}</p>
          {topics.map((topic) => (
            <button
              key={topic.topicId}
              type="button"
              className={
                activeTopicId === topic.topicId
                  ? 'consumer-guide-toc__link consumer-guide-toc__link--active'
                  : 'consumer-guide-toc__link'
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
              id={consumerGuideTopicElementId(topic.topicId)}
              className="consumer-guide-section"
            >
              <h2 className="consumer-guide-section__title">{topic.title}</h2>
              {topic.summary ? (
                <p className="consumer-guide-section__summary">{topic.summary}</p>
              ) : null}
              <ConsumerGuideStepList steps={topic.steps} primaryColor={primaryColor} />
              <div className="consumer-guide-section__actions">
                <IonButton
                  size="small"
                  fill="clear"
                  className="consumer-guide-section__ask"
                  onClick={() =>
                    fireConsumerGuideAssistantSeed({
                      topicId: topic.topicId,
                      topicTitle: topic.title,
                      walkThroughTemplate: copy.guideWalkThroughTopic,
                    })
                  }
                >
                  <IonIcon icon={sparkles} slot="start" aria-hidden="true" />
                  {copy.guidePageAskSection}
                </IonButton>
                {topic.navigateTarget ? (
                  <IonButton
                    size="small"
                    fill="outline"
                    onClick={() => {
                      const href = resolveConsumerGuideNavigateHref(slug, topic.navigateTarget!);
                      if (href) history.push(href);
                    }}
                  >
                    {copy.guidePageOpenInApp}
                  </IonButton>
                ) : null}
              </div>
            </section>
          ))}
        </div>
      </IonContent>
    </IonPage>
  );
}
