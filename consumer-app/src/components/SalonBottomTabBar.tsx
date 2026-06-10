import { IonBadge, IonIcon } from '@ionic/react';
import {
  beakerOutline,
  calendarOutline,
  flaskOutline,
  homeOutline,
  personOutline,
} from 'ionicons/icons';
import type { ConsumerCopy } from '../lib/consumer-copy.types.js';
import type { SalonTabId } from '../lib/salon-tab-route.util.js';

export function SalonBottomTabBar({
  activeTab,
  showResultsTab,
  pendingLabCount,
  copy,
  onOpenTab,
}: {
  activeTab: string;
  showResultsTab: boolean;
  pendingLabCount: number;
  copy: ConsumerCopy;
  onOpenTab: (tab: SalonTabId) => void;
}) {
  return (
    <nav className="salon-bottom-tab-bar" aria-label="Salon navigation">
      <button
        type="button"
        className={`salon-tab-btn${activeTab === 'home' ? ' is-active' : ''}`}
        onClick={() => onOpenTab('home')}
      >
        <IonIcon icon={homeOutline} aria-hidden />
        <span>Home</span>
      </button>
      <button
        type="button"
        className={`salon-tab-btn${activeTab === 'services' ? ' is-active' : ''}`}
        onClick={() => onOpenTab('services')}
      >
        <IonIcon icon={calendarOutline} aria-hidden />
        <span>Book</span>
      </button>
      {showResultsTab ? (
        <button
          type="button"
          className={`salon-tab-btn${activeTab === 'lab-to-book' ? ' is-active' : ''}`}
          onClick={() => onOpenTab('lab-to-book')}
        >
          <IonIcon icon={beakerOutline} aria-hidden />
          <span>{copy.myLabToBookTab}</span>
          {pendingLabCount > 0 ? (
            <IonBadge color="danger" className="salon-tab-badge">
              {pendingLabCount}
            </IonBadge>
          ) : null}
        </button>
      ) : null}
      {showResultsTab ? (
        <button
          type="button"
          className={`salon-tab-btn${activeTab === 'results' ? ' is-active' : ''}`}
          onClick={() => onOpenTab('results')}
        >
          <IonIcon icon={flaskOutline} aria-hidden />
          <span>{copy.myResultsTab}</span>
        </button>
      ) : null}
      <button
        type="button"
        className={`salon-tab-btn${activeTab === 'account' ? ' is-active' : ''}`}
        onClick={() => onOpenTab('account')}
      >
        <IonIcon icon={personOutline} aria-hidden />
        <span>Account</span>
      </button>
    </nav>
  );
}
