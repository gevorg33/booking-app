import { IonIcon } from '@ionic/react';
import {
  calendarClearOutline,
  calendarOutline,
  documentTextOutline,
  flaskOutline,
  giftOutline,
  listOutline,
  peopleOutline,
  personOutline,
  todayOutline,
} from 'ionicons/icons';
import { useEffect, useRef } from 'react';
import { useI18n } from '../i18n';
import type { ProviderTabId } from '../lib/provider-tab-route.util';

export function ProviderBottomTabBar({
  activeTab,
  showLabCollection,
  onOpenTab,
}: {
  activeTab: ProviderTabId;
  showLabCollection: boolean;
  onOpenTab: (tab: ProviderTabId) => void;
}) {
  const { t } = useI18n();
  const navRef = useRef<HTMLElement | null>(null);

  // e2e-bug.65 — when clinic tabs overflow, keep the active tab scrolled into view.
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const active = nav.querySelector<HTMLElement>('.provider-tab-btn.is-active');
    active?.scrollIntoView({
      inline: 'nearest',
      block: 'nearest',
      behavior: 'smooth',
    });
  }, [activeTab, showLabCollection]);

  const tabBtn = (tab: ProviderTabId, icon: string, label: string) => (
    <button
      key={tab}
      type="button"
      className={`provider-tab-btn${activeTab === tab ? ' is-active' : ''}`}
      onClick={() => onOpenTab(tab)}
    >
      <IonIcon icon={icon} aria-hidden />
      <span>{label}</span>
    </button>
  );

  return (
    <nav
      ref={navRef}
      className="provider-bottom-tab-bar"
      aria-label={t('provider.navToday')}
    >
      {tabBtn('today', todayOutline, t('provider.navToday'))}
      {showLabCollection &&
        tabBtn('lab-collection', flaskOutline, t('provider.navLabCollection'))}
      {showLabCollection &&
        tabBtn('lab-results', documentTextOutline, t('provider.navLabResults'))}
      {showLabCollection &&
        tabBtn('clinic-tasks', listOutline, t('provider.navClinicTasks'))}
      {showLabCollection &&
        tabBtn('patients', peopleOutline, t('provider.navPatients'))}
      {tabBtn('gift-cards', giftOutline, t('provider.navGiftCards'))}
      {tabBtn('calendar', calendarClearOutline, t('provider.navCalendar'))}
      {tabBtn('schedule', calendarOutline, t('provider.navSchedule'))}
      {tabBtn('profile', personOutline, t('provider.navProfile'))}
    </nav>
  );
}
