import { IonButton, useIonActionSheet } from '@ionic/react';
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
            fill="outline"
            onClick={() => handleContact('call')}
          >
            {t('provider.customerContactCall')}
          </IonButton>
        ) : null}
        {smsEnabled ? (
          <IonButton
            expand="block"
            fill="outline"
            onClick={() => handleContact('sms')}
          >
            {t('provider.customerContactSms')}
          </IonButton>
        ) : null}
        {whatsappEnabled ? (
          <IonButton
            expand="block"
            fill="outline"
            onClick={() => handleContact('whatsapp')}
          >
            {t('provider.customerContactWhatsApp')}
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
