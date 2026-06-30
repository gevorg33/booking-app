import { useIonViewDidEnter, useIonViewDidLeave } from '@ionic/react';
import { useState } from 'react';

/** Hide portaled tab bar / FAB when Ionic keeps this tab page in the back stack. */
export function useProviderTabOverlaysVisible() {
  const [visible, setVisible] = useState(false);

  useIonViewDidEnter(() => {
    setVisible(true);
    document.body.classList.add('provider-tab-active');
  });

  useIonViewDidLeave(() => {
    setVisible(false);
    document.body.classList.remove('provider-tab-active');
  });

  return { overlaysVisible: visible };
}
