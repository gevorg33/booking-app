import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GiftCard } from './entities/gift-card.entity.js';
import { EmailService } from '../notifications/email.service.js';
import { WhatsAppService } from '../notifications/whatsapp.service.js';
import { WhatsAppIntegrationService } from '../notifications/whatsapp-integration.service.js';
import {
  buildPublicBookingLinks,
  buildPurchaserReceiptEmail,
  buildRecipientGiftCardEmail,
  buildWhatsAppGiftCardSummary,
  resolveGiftCardSenderName,
} from './gift-card-delivery-content.util.js';

@Injectable()
export class GiftCardDeliveryService {
  private readonly logger = new Logger(GiftCardDeliveryService.name);

  constructor(
    @InjectRepository(GiftCard) private giftCardRepo: Repository<GiftCard>,
    private emailService: EmailService,
    private whatsappService: WhatsAppService,
    private whatsappIntegrationService: WhatsAppIntegrationService,
    private configService: ConfigService,
  ) {}

  async deliverDigitalGiftCard(giftCardId: string): Promise<void> {
    const card = await this.giftCardRepo.findOne({
      where: { id: giftCardId },
      relations: { serviceCredits: true, business: true, purchaser: true },
    });
    if (!card || card.deliveryMethod !== 'digital') return;

    const recipientEmail = card.recipientEmail ?? card.purchaserEmail;
    const recipientPhone = card.recipientPhone?.trim() || null;

    if (!recipientEmail && !recipientPhone) {
      this.logger.warn(
        `Gift card ${card.id} has no recipient email or phone for digital delivery`,
      );
      return;
    }

    const links = buildPublicBookingLinks(
      card.business?.slug,
      this.configService.get<string>('FRONTEND_URL'),
    );
    let delivered = false;

    if (recipientEmail) {
      const email = buildRecipientGiftCardEmail(card, links);
      if (email) {
        await this.emailService.send({
          to: recipientEmail,
          subject: email.subject,
          html: email.html,
          text: email.text,
        });
        delivered = true;
      }

      if (card.purchaserEmail && card.purchaserEmail !== recipientEmail) {
        const receipt = buildPurchaserReceiptEmail(card, recipientEmail, links);
        if (receipt) {
          await this.emailService.send({
            to: card.purchaserEmail,
            subject: receipt.subject,
            html: receipt.html,
            text: receipt.text,
          });
        }
      }
    }

    if (recipientPhone) {
      const whatsappConfig =
        this.whatsappIntegrationService.resolveRuntimeConfig(
          card.business?.settings,
        );
      if (!whatsappConfig) {
        this.logger.warn(
          `WhatsApp not configured — skipping gift card WhatsApp for ${card.id}`,
        );
      } else {
        const whatsappSummary = buildWhatsAppGiftCardSummary(card, links);
        const businessName = card.business?.name ?? 'Gift card';
        const summary = whatsappSummary.includes(businessName)
          ? whatsappSummary
          : `${businessName} — ${whatsappSummary}`;
        const result = await this.whatsappService.sendGiftCardMessage(
          {
            toPhone: recipientPhone,
            recipientName: card.recipientName ?? 'there',
            senderName: resolveGiftCardSenderName(card),
            giftCardCode: card.code,
            summary,
          },
          whatsappConfig,
        );
        if (result.ok) {
          delivered = true;
        } else {
          this.logger.warn(
            `Gift card WhatsApp failed for ${card.id}: ${result.error}`,
          );
        }
      }
    }

    if (!delivered) return;

    card.fulfillmentStatus = 'delivered';
    await this.giftCardRepo.save(card);
  }
}
