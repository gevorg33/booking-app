import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GiftCard } from './entities/gift-card.entity.js';
import { EmailService } from '../notifications/email.service.js';
import { WhatsAppService } from '../notifications/whatsapp.service.js';
import { WhatsAppIntegrationService } from '../notifications/whatsapp-integration.service.js';

@Injectable()
export class GiftCardDeliveryService {
  private readonly logger = new Logger(GiftCardDeliveryService.name);

  constructor(
    @InjectRepository(GiftCard) private giftCardRepo: Repository<GiftCard>,
    private emailService: EmailService,
    private whatsappService: WhatsAppService,
    private whatsappIntegrationService: WhatsAppIntegrationService,
  ) {}

  async deliverDigitalGiftCard(giftCardId: string): Promise<void> {
    const card = await this.giftCardRepo.findOne({
      where: { id: giftCardId },
      relations: { serviceCredits: true, business: true },
    });
    if (!card || card.deliveryMethod !== 'digital') return;

    const recipientEmail = card.recipientEmail ?? card.purchaserEmail;
    const recipientPhone = card.recipientPhone?.trim() || null;

    if (!recipientEmail && !recipientPhone) {
      this.logger.warn(`Gift card ${card.id} has no recipient email or phone for digital delivery`);
      return;
    }

    const summary = this.buildSummary(card);
    let delivered = false;

    if (recipientEmail) {
      await this.emailService.send({
        to: recipientEmail,
        subject: `Your gift card from ${card.business?.name ?? 'us'}`,
        html: `<p>${summary.replace(/\n/g, '<br/>')}</p>`,
        text: summary,
      });
      delivered = true;

      if (card.purchaserEmail && card.purchaserEmail !== recipientEmail) {
        await this.emailService.send({
          to: card.purchaserEmail,
          subject: 'Gift card purchase receipt',
          html: `<p>Your gift card order was delivered to ${recipientEmail}.</p>`,
          text: `Your gift card order was delivered to ${recipientEmail}.`,
        });
      }
    }

    if (recipientPhone) {
      const whatsappConfig = this.whatsappIntegrationService.resolveRuntimeConfig(
        card.business?.settings,
      );
      if (!whatsappConfig) {
        this.logger.warn(`WhatsApp not configured — skipping gift card WhatsApp for ${card.id}`);
      } else {
        const whatsappSummary = this.buildWhatsAppSummary(card);
        const result = await this.whatsappService.sendGiftCardMessage(
          {
            toPhone: recipientPhone,
            recipientName: card.recipientName ?? 'there',
            businessName: card.business?.name ?? 'Gift card',
            giftCardCode: card.code,
            summary: whatsappSummary,
          },
          whatsappConfig,
        );
        if (result.ok) {
          delivered = true;
        } else {
          this.logger.warn(`Gift card WhatsApp failed for ${card.id}: ${result.error}`);
        }
      }
    }

    if (!delivered) return;

    card.fulfillmentStatus = 'delivered';
    await this.giftCardRepo.save(card);
  }

  private buildWhatsAppSummary(card: GiftCard): string {
    const parts: string[] = [];
    if (card.personalMessage) parts.push(card.personalMessage);

    if (card.cardType === 'monetary') {
      parts.push(`Balance: ${card.currency} ${Number(card.balance).toFixed(2)}`);
    } else {
      for (const credit of card.serviceCredits ?? []) {
        parts.push(`${credit.serviceName} x${credit.quantityRemaining}`);
      }
    }

    if (card.expiresAt) {
      parts.push(`Expires ${card.expiresAt.toISOString().slice(0, 10)}`);
    }

    return parts.join(' · ').slice(0, 1024) || 'Redeem at checkout with your code.';
  }

  private buildSummary(card: GiftCard): string {
    const lines = [
      `Gift card code: ${card.code}`,
      card.personalMessage ? `Message: ${card.personalMessage}` : null,
    ];

    if (card.cardType === 'monetary') {
      lines.push(`Balance: ${card.currency} ${Number(card.balance).toFixed(2)}`);
    } else {
      for (const credit of card.serviceCredits ?? []) {
        lines.push(`${credit.serviceName} × ${credit.quantityRemaining}`);
      }
    }

    if (card.expiresAt) {
      lines.push(`Expires: ${card.expiresAt.toISOString().slice(0, 10)}`);
    }

    return lines.filter(Boolean).join('\n');
  }
}
