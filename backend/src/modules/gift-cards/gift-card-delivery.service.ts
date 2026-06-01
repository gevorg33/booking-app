import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GiftCard } from './entities/gift-card.entity.js';
import { EmailService } from '../notifications/email.service.js';

@Injectable()
export class GiftCardDeliveryService {
  private readonly logger = new Logger(GiftCardDeliveryService.name);

  constructor(
    @InjectRepository(GiftCard) private giftCardRepo: Repository<GiftCard>,
    private emailService: EmailService,
  ) {}

  async deliverDigitalGiftCard(giftCardId: string): Promise<void> {
    const card = await this.giftCardRepo.findOne({
      where: { id: giftCardId },
      relations: { serviceCredits: true, business: true },
    });
    if (!card || card.deliveryMethod !== 'digital') return;

    const recipientEmail = card.recipientEmail ?? card.purchaserEmail;
    if (!recipientEmail) {
      this.logger.warn(`Gift card ${card.id} has no recipient email for digital delivery`);
      return;
    }

    const summary = this.buildSummary(card);
    await this.emailService.send({
      to: recipientEmail,
      subject: `Your gift card from ${card.business?.name ?? 'us'}`,
      html: `<p>${summary.replace(/\n/g, '<br/>')}</p>`,
      text: summary,
    });

    if (card.purchaserEmail && card.purchaserEmail !== recipientEmail) {
      await this.emailService.send({
        to: card.purchaserEmail,
        subject: 'Gift card purchase receipt',
        html: `<p>Your gift card order was delivered to ${recipientEmail}.</p>`,
        text: `Your gift card order was delivered to ${recipientEmail}.`,
      });
    }

    card.fulfillmentStatus = 'delivered';
    await this.giftCardRepo.save(card);
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
