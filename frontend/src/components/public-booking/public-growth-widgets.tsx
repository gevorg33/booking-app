'use client';

import { MessageCircle, Send } from 'lucide-react';
import type { PublicMessagingLinks, PublicMetaBooking } from '@/lib/public-api';
import { ZendeskWidget } from '@/components/integrations/zendesk-widget';

export function PublicGrowthWidgets({
  zendeskWidgetKey,
  metaBooking,
  messaging,
}: {
  zendeskWidgetKey?: string;
  metaBooking?: PublicMetaBooking;
  messaging?: PublicMessagingLinks;
}) {
  const links = [
    metaBooking?.bookingUrl && {
      href: metaBooking.bookingUrl,
      label: metaBooking.buttonLabel || 'Book online',
    },
    messaging?.telegramUrl && { href: messaging.telegramUrl, label: 'Book via Telegram' },
    messaging?.whatsappUrl && { href: messaging.whatsappUrl, label: 'Book via WhatsApp' },
    messaging?.facebookBookingUrl && {
      href: messaging.facebookBookingUrl,
      label: 'Facebook',
    },
    messaging?.instagramBookingUrl && {
      href: messaging.instagramBookingUrl,
      label: 'Instagram',
    },
  ].filter(Boolean) as { href: string; label: string }[];

  if (!zendeskWidgetKey && links.length === 0) return null;

  return (
    <>
      <ZendeskWidget widgetKey={zendeskWidgetKey} />
      {links.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 pb-6">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-800 mb-3">
              <MessageCircle className="w-4 h-4 text-violet-600" />
              Book another way
            </div>
            <div className="flex flex-wrap gap-2">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
