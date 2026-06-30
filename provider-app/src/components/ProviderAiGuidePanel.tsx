import { useState } from 'react';
import { IonButton, IonSpinner, IonText } from '@ionic/react';
import { useI18n } from '../i18n';
import api, { unwrap } from '../services/api';
import { useAuthStore } from '../services/auth-store';
import type { AiGuideResponse } from '../lib/ai-client.types';
import { submitGuideSupportHandoff } from '../lib/guide-support-handoff.util';

function hasGuideSteps(
  guide: AiGuideResponse | null | undefined,
): guide is AiGuideResponse {
  return Boolean(guide?.steps?.length);
}

export function ProviderAiGuidePanel({
  guide,
  onNavigate,
}: {
  guide: AiGuideResponse;
  onNavigate?: (path: string) => void;
}) {
  const { t } = useI18n();
  const { business, user } = useAuthStore();
  const [cursor, setCursor] = useState(0);
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportError, setSupportError] = useState<string | null>(null);
  const [supportUrl, setSupportUrl] = useState<string | null>(null);

  if (!hasGuideSteps(guide)) return null;

  const step = guide.steps[cursor];
  if (!step) return null;

  const atEnd = cursor >= guide.steps.length - 1;
  const navigateTarget = step.navigate ?? (atEnd ? guide.navigate : undefined);
  const supportHandoff = atEnd ? guide.supportHandoff : undefined;

  const submitSupportHandoff = async () => {
    if (!supportHandoff || !business?.id) return;
    setSupportLoading(true);
    setSupportError(null);
    setSupportUrl(null);
    try {
      const result = await submitGuideSupportHandoff(
        async (path, body) => {
          const { data: res } = await api.post(path, body);
          return unwrap(res);
        },
        {
          businessId: business.id,
          handoff: supportHandoff,
          requesterEmail: user?.email,
          requesterName: user?.firstName
            ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`
            : undefined,
        },
      );
      if (result.url) {
        setSupportUrl(result.url);
      }
    } catch {
      setSupportError(t('ai.guideSupportHandoffFailed'));
    } finally {
      setSupportLoading(false);
    }
  };

  return (
    <div className="ai-assistant-guide">
      {guide.summary ? <p className="booking-meta">{guide.summary}</p> : null}
      <div className="ai-assistant-guide-card">
        <p className="booking-meta">
          {t('ai.guideStepOf', {
            current: cursor + 1,
            total: guide.steps.length,
          })}
        </p>
        <p>{step.title}</p>
        <p className="booking-meta">{step.body}</p>
        <div className="ai-assistant-guide-actions">
          {!atEnd ? (
            <IonButton
              size="small"
              onClick={() => setCursor((current) => Math.min(current + 1, guide.steps.length - 1))}
            >
              {t('ai.guideNextStep')}
            </IonButton>
          ) : null}
          {navigateTarget?.path && onNavigate ? (
            <IonButton
              size="small"
              fill="outline"
              onClick={() => {
                const params = new URLSearchParams(navigateTarget.query ?? {});
                const qs = params.toString();
                onNavigate(`${navigateTarget.path}${qs ? `?${qs}` : ''}`);
              }}
            >
              {t('ai.guideOpenInApp')}
            </IonButton>
          ) : null}
          {supportHandoff && business?.id ? (
            supportUrl ? (
              <IonButton
                size="small"
                fill="outline"
                href={supportUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('support.openInZendesk')}
              </IonButton>
            ) : (
              <>
                <IonButton
                  size="small"
                  fill="outline"
                  disabled={supportLoading}
                  onClick={() => void submitSupportHandoff()}
                >
                  {supportLoading ? <IonSpinner name="crescent" /> : null}
                  {supportHandoff.label || t('ai.guideStillStuck')}
                </IonButton>
                {supportError ? (
                  <IonText color="danger">
                    <p className="booking-meta">{supportError}</p>
                  </IonText>
                ) : null}
              </>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
