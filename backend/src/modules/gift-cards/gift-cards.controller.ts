import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { BusinessService } from '../business/business.service.js';
import { GiftCardsService } from './gift-cards.service.js';
import { GiftCardPurchaseService } from './gift-card-purchase.service.js';
import { GiftCardFulfillmentService } from './gift-card-fulfillment.service.js';
import { GiftCardOrderService } from './gift-card-order.service.js';
import {
  mergeGiftCardSettings,
  readBusinessGiftCardSettings,
  type GiftCardBusinessSettings,
} from './gift-card.types.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { NotFoundException } from '@nestjs/common';

@Controller('businesses/:businessId/gift-cards')
export class GiftCardsController {
  constructor(
    private giftCardsService: GiftCardsService,
    private purchaseService: GiftCardPurchaseService,
    private fulfillmentService: GiftCardFulfillmentService,
    private orderService: GiftCardOrderService,
    private businessService: BusinessService,
    @InjectRepository(Business) private businessRepo: Repository<Business>,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.giftCardsService.list(businessId);
  }

  @Get('settings')
  @UseGuards(JwtAuthGuard)
  async getSettings(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    return { settings: readBusinessGiftCardSettings(business?.settings) };
  }

  @Put('settings')
  @UseGuards(JwtAuthGuard)
  async updateSettings(
    @Param('businessId') businessId: string,
    @Body() dto: Partial<GiftCardBusinessSettings>,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');
    const next = mergeGiftCardSettings({
      ...readBusinessGiftCardSettings(business.settings),
      ...dto,
    });
    business.settings = { ...(business.settings ?? {}), giftCards: next };
    await this.businessRepo.save(business);
    return { settings: next };
  }

  @Get('fulfillment')
  @UseGuards(JwtAuthGuard)
  async listFulfillment(
    @Param('businessId') businessId: string,
    @Query('status') status: string | undefined,
    @Query('search') search: string | undefined,
    @Query('page') page: string | undefined,
    @Query('pageSize') pageSize: string | undefined,
    @Query('sortBy') sortBy: string | undefined,
    @Query('sortOrder') sortOrder: string | undefined,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.fulfillmentService.listDashboardOrders(businessId, {
      status: status as any,
      search,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      sortBy: sortBy === 'createdAt' ? 'createdAt' : 'createdAt',
      sortOrder: sortOrder === 'ASC' ? 'ASC' : 'DESC',
    });
  }

  @Get('fulfillment/:giftCardId')
  @UseGuards(JwtAuthGuard)
  async getFulfillmentOrder(
    @Param('businessId') businessId: string,
    @Param('giftCardId') giftCardId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return {
      order: await this.fulfillmentService.getDashboardOrder(
        businessId,
        giftCardId,
      ),
    };
  }

  @Put('fulfillment/:giftCardId/ship')
  @UseGuards(JwtAuthGuard)
  async markShipped(
    @Param('businessId') businessId: string,
    @Param('giftCardId') giftCardId: string,
    @Body() dto: { carrier: string; trackingNumber: string },
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.fulfillmentService.markShipped(
      businessId,
      giftCardId,
      dto.carrier,
      dto.trackingNumber,
    );
  }

  @Get('change-requests')
  @UseGuards(JwtAuthGuard)
  async listChangeRequests(
    @Param('businessId') businessId: string,
    @Query('status') status: string | undefined,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return {
      requests: await this.orderService.listChangeRequests(businessId, status),
    };
  }

  @Put('change-requests/:requestId/resolve')
  @UseGuards(JwtAuthGuard)
  async resolveChangeRequest(
    @Param('businessId') businessId: string,
    @Param('requestId') requestId: string,
    @Body()
    dto: {
      resolution: 'approve' | 'deny' | 'needs_info';
      specialistNotes?: string;
    },
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.orderService.resolveChangeRequest(
      businessId,
      requestId,
      dto.resolution,
      dto.specialistNotes,
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Param('businessId') businessId: string,
    @Body() dto: { amount: number; currency?: string; expiresAt?: string },
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.giftCardsService.create(businessId, dto);
  }

  @Put(':giftCardId/expiration')
  @UseGuards(JwtAuthGuard)
  async updateExpiration(
    @Param('businessId') businessId: string,
    @Param('giftCardId') giftCardId: string,
    @Body()
    dto: {
      expiresAt?: string | null;
      extendMonths?: number;
      extendDays?: number;
      note?: string;
    },
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    const card = await this.giftCardsService.updateExpiration(
      businessId,
      giftCardId,
      dto,
      user.id,
    );
    return { card };
  }

  @Get(':giftCardId/expiration-audit')
  @UseGuards(JwtAuthGuard)
  async expirationAudit(
    @Param('businessId') businessId: string,
    @Param('giftCardId') giftCardId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return {
      entries: await this.giftCardsService.listExpirationAudit(giftCardId),
    };
  }

  @Get(':giftCardId/history')
  @UseGuards(JwtAuthGuard)
  async history(
    @Param('businessId') businessId: string,
    @Param('giftCardId') giftCardId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return {
      redemptions: await this.giftCardsService.listRedemptions(giftCardId),
    };
  }

  @Post('validate')
  async validate(
    @Param('businessId') businessId: string,
    @Body() dto: { code: string; serviceId?: string },
  ) {
    const card = await this.giftCardsService.validate(
      businessId,
      dto.code,
      dto.serviceId,
    );
    return this.giftCardsService.getBalanceView(businessId, card.code);
  }

  @Post('redeem')
  async redeem(
    @Param('businessId') businessId: string,
    @Body()
    dto: {
      code: string;
      amount?: number;
      serviceId?: string;
      bookingId?: string;
    },
  ) {
    if (dto.serviceId) {
      const card = await this.giftCardsService.redeemServiceCredit(
        businessId,
        dto.code,
        dto.serviceId,
        dto.bookingId,
      );
      return this.giftCardsService.getBalanceView(businessId, card.code);
    }
    const card = await this.giftCardsService.redeem(
      businessId,
      dto.code,
      Number(dto.amount ?? 0),
      dto.bookingId,
    );
    return this.giftCardsService.getBalanceView(businessId, card.code);
  }
}

@Controller('businesses/:businessId/provider/gift-cards')
@UseGuards(JwtAuthGuard)
export class GiftCardProviderController {
  constructor(
    private fulfillmentService: GiftCardFulfillmentService,
    private businessService: BusinessService,
  ) {}

  @Get('card-creation')
  async cardCreationQueue(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return {
      orders: await this.fulfillmentService.listCardCreationQueue(businessId),
    };
  }

  @Get('delivery')
  async deliveryQueue(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return {
      orders: await this.fulfillmentService.listDeliveryQueue(businessId),
    };
  }

  @Put('card-creation/:giftCardId/ready')
  async markCardReady(
    @Param('businessId') businessId: string,
    @Param('giftCardId') giftCardId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.fulfillmentService.markCardReady(
      businessId,
      giftCardId,
      user.id,
    );
  }

  @Put('delivery/:giftCardId/out-for-delivery')
  async markOutForDelivery(
    @Param('businessId') businessId: string,
    @Param('giftCardId') giftCardId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.fulfillmentService.markOutForDelivery(
      businessId,
      giftCardId,
      user.id,
    );
  }

  @Put('delivery/:giftCardId/delivered')
  async markDelivered(
    @Param('businessId') businessId: string,
    @Param('giftCardId') giftCardId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.fulfillmentService.markDelivered(businessId, giftCardId);
  }
}
