import { useIonViewDidEnter, useIonViewDidLeave } from '@ionic/react';
import { useState } from 'react';

/** Hide portaled tab bar / FAB when Ionic keeps this tab page in the back stack. */
export function useSalonTabOverlaysVisible() {
  const [visible, setVisible] = useState(false);

  useIonViewDidEnter(() => {
    setVisible(true);
    document.body.classList.add('salon-tab-active');
  });

  useIonViewDidLeave(() => {
    setVisible(false);
    document.body.classList.remove('salon-tab-active');
  });

  return { overlaysVisible: visible };
}
