import type { CSSProperties } from 'react';
import { IonButton, IonIcon, useIonActionSheet } from '@ionic/react';
import { callOutline, chatbubbleOutline, logoWhatsapp } from 'ionicons/icons';
import {
  buildCustomerSmsLink,
  buildCustomerSmsLinkWithBody,
  buildCustomerTelLink,
  buildCustomerWhatsAppLink,
  buildCustomerWhatsAppLinkWithBody,
  type StaffContactChannel,
} from '../lib/provider-customer-contact.util';
import { trackStaffContactedCustomer } from '../lib/provider-customer-contact-analytics';
import { useI18n } from '../i18n';

export interface StaffMessageTemplateView {
  id: string;
  label: string;
  body: string;
}

export interface BookingCustomerContactActionsProps {
  bookingId: string;
  phone: string;
  callEnabled?: boolean;
  smsEnabled?: boolean;
  whatsappEnabled?: boolean;
  templates?: StaffMessageTemplateView[] | null;
}

function openContactLink(href: string | null): void {
  if (!href) return;
  window.location.href = href;
}

export default function BookingCustomerContactActions({
  bookingId,
  phone,
  callEnabled = true,
  smsEnabled = true,
  whatsappEnabled = false,
  templates = null,
}: BookingCustomerContactActionsProps) {
  const { t } = useI18n();
  const [presentActionSheet] = useIonActionSheet();

  const handleContact = (
    channel: StaffContactChannel,
    body?: string,
    templateId?: string,
  ) => {
    trackStaffContactedCustomer(bookingId, channel, templateId);

    if (channel === 'call') {
      openContactLink(buildCustomerTelLink(phone));
      return;
    }
    if (channel === 'sms') {
      openContactLink(
        body
          ? buildCustomerSmsLinkWithBody(phone, body)
          : buildCustomerSmsLink(phone),
      );
      return;
    }
    openContactLink(
      body
        ? buildCustomerWhatsAppLinkWithBody(phone, body)
        : buildCustomerWhatsAppLink(phone),
    );
  };

  const openTemplate = (template: StaffMessageTemplateView) => {
    const channels: Array<{ channel: 'sms' | 'whatsapp'; label: string }> = [];
    if (smsEnabled) {
      channels.push({
        channel: 'sms',
        label: t('provider.customerContactSendViaSms'),
      });
    }
    if (whatsappEnabled) {
      channels.push({
        channel: 'whatsapp',
        label: t('provider.customerContactSendViaWhatsApp'),
      });
    }
    if (channels.length === 0) return;
    if (channels.length === 1) {
      handleContact(channels[0]!.channel, template.body, template.id);
      return;
    }

    void presentActionSheet({
      header: t('provider.customerContactChooseChannel'),
      buttons: [
        ...channels.map((entry) => ({
          text: entry.label,
          handler: () => {
            handleContact(entry.channel, template.body, template.id);
          },
        })),
        {
          text: t('common.cancel'),
          role: 'cancel',
        },
      ],
    });
  };

  return (
    <div className="ion-margin-bottom customer-contact-actions">
      <h3>{t('provider.customerContactTitle')}</h3>
      <div className="customer-contact-actions__buttons">
        {callEnabled ? (
          <IonButton
            expand="block"
            fill="clear"
            color="tertiary"
            aria-label={t('provider.customerContactCall')}
            title={t('provider.customerContactCall')}
            onClick={() => handleContact('call')}
          >
            <IonIcon
              icon={callOutline}
              slot="icon-only"
              aria-hidden="true"
              style={{ fontSize: '28px' }}
            />
          </IonButton>
        ) : null}
        {smsEnabled ? (
          <IonButton
            expand="block"
            fill="clear"
            color="primary"
            aria-label={t('provider.customerContactSms')}
            title={t('provider.customerContactSms')}
            onClick={() => handleContact('sms')}
          >
            <IonIcon
              icon={chatbubbleOutline}
              slot="icon-only"
              aria-hidden="true"
              style={{ fontSize: '28px' }}
            />
          </IonButton>
        ) : null}
        {whatsappEnabled ? (
          <IonButton
            expand="block"
            fill="clear"
            style={{ '--color': '#25D366' } as CSSProperties}
            aria-label={t('provider.customerContactWhatsApp')}
            title={t('provider.customerContactWhatsApp')}
            onClick={() => handleContact('whatsapp')}
          >
            <IonIcon
              icon={logoWhatsapp}
              slot="icon-only"
              aria-hidden="true"
              style={{ fontSize: '28px' }}
            />
          </IonButton>
        ) : null}
      </div>

      {templates && templates.length > 0 ? (
        <div className="customer-contact-actions__templates">
          <h4>{t('provider.customerContactTemplatesTitle')}</h4>
          <div className="customer-contact-actions__template-chips">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                className="ai-assistant-example"
                onClick={() => openTemplate(template)}
              >
                {template.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
