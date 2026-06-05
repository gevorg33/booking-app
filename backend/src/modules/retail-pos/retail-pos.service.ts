import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
import { Product } from '../inventory/entities/inventory.entity.js';
import { BookingRetailSale } from './entities/booking-retail-sale.entity.js';
import { SetBookingRetailSalesDto } from './dto/set-booking-retail-sales.dto.js';
import type {
  BookingRetailCheckoutView,
  BookingRetailSaleView,
  RetailProductView,
} from './retail-pos.types.js';

@Injectable()
export class RetailPosService {
  constructor(
    @InjectRepository(BookingRetailSale)
    private saleRepo: Repository<BookingRetailSale>,
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
  ) {}

  async listSellableProducts(businessId: string): Promise<RetailProductView[]> {
    const products = await this.productRepo.find({
      where: { businessId, isActive: true },
      order: { name: 'ASC' },
    });

    return products
      .filter((p) => Number(p.retailPrice) > 0 && p.quantityOnHand > 0)
      .map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku ?? null,
        retailPrice: Number(p.retailPrice),
        quantityOnHand: p.quantityOnHand,
      }));
  }

  async getBookingRetailSales(
    businessId: string,
    bookingId: string,
  ): Promise<BookingRetailCheckoutView> {
    const booking = await this.findBooking(businessId, bookingId);
    const lines = await this.loadSaleViews(bookingId);
    return {
      lines,
      retailTotal: this.sumLines(lines),
      currency: booking.service?.currency || 'USD',
    };
  }

  async setBookingRetailSales(
    businessId: string,
    bookingId: string,
    userId: string,
    dto: SetBookingRetailSalesDto,
  ): Promise<BookingRetailCheckoutView> {
    const booking = await this.findBooking(businessId, bookingId);
    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException(
        'Cannot add retail sales to a cancelled booking',
      );
    }

    const normalizedLines = this.normalizeLines(dto.lines);
    await this.saleRepo.manager.transaction(async (manager) => {
      const saleRepo = manager.getRepository(BookingRetailSale);
      const productRepo = manager.getRepository(Product);

      const existing = await saleRepo.find({
        where: { bookingId },
        relations: { product: true },
      });

      for (const sale of existing) {
        if (sale.product) {
          sale.product.quantityOnHand += sale.quantity;
          await productRepo.save(sale.product);
        }
      }
      if (existing.length > 0) {
        await saleRepo.delete({ bookingId });
      }

      for (const line of normalizedLines) {
        const product = await productRepo.findOne({
          where: { id: line.productId, businessId, isActive: true },
          lock: { mode: 'pessimistic_write' },
        });
        if (!product)
          throw new NotFoundException(`Product ${line.productId} not found`);
        const unitPrice = Number(product.retailPrice);
        if (unitPrice <= 0) {
          throw new BadRequestException(
            `${product.name} is not configured for retail sale`,
          );
        }
        if (product.quantityOnHand < line.quantity) {
          throw new BadRequestException(
            `Insufficient stock for ${product.name}`,
          );
        }

        product.quantityOnHand -= line.quantity;
        await productRepo.save(product);

        const lineTotal = roundMoney(unitPrice * line.quantity);
        await saleRepo.save(
          saleRepo.create({
            businessId,
            bookingId,
            productId: product.id,
            quantity: line.quantity,
            unitPrice,
            lineTotal,
            soldByUserId: userId,
          }),
        );
      }
    });

    const lines = await this.loadSaleViews(bookingId);
    const retailTotal = this.sumLines(lines);
    booking.metadata = {
      ...(booking.metadata ?? {}),
      retailPos: {
        retailTotal,
        lineCount: lines.length,
        updatedAt: new Date().toISOString(),
      },
    };
    await this.bookingRepo.save(booking);

    return {
      lines,
      retailTotal,
      currency: booking.service?.currency || 'USD',
    };
  }

  async listSaleViewsForBookings(
    bookingIds: string[],
  ): Promise<Map<string, BookingRetailSaleView[]>> {
    if (bookingIds.length === 0) return new Map();
    const sales = await this.saleRepo.find({
      where: { bookingId: In(bookingIds) },
      relations: { product: true },
      order: { createdAt: 'ASC' },
    });
    const map = new Map<string, BookingRetailSaleView[]>();
    for (const sale of sales) {
      const view = this.toSaleView(sale);
      const list = map.get(sale.bookingId) ?? [];
      list.push(view);
      map.set(sale.bookingId, list);
    }
    return map;
  }

  private normalizeLines(lines: SetBookingRetailSalesDto['lines']) {
    const merged = new Map<string, number>();
    for (const line of lines ?? []) {
      const qty = Math.floor(line.quantity);
      if (qty <= 0) continue;
      merged.set(line.productId, (merged.get(line.productId) ?? 0) + qty);
    }
    return [...merged.entries()].map(([productId, quantity]) => ({
      productId,
      quantity,
    }));
  }

  private async loadSaleViews(
    bookingId: string,
  ): Promise<BookingRetailSaleView[]> {
    const sales = await this.saleRepo.find({
      where: { bookingId },
      relations: { product: true },
      order: { createdAt: 'ASC' },
    });
    return sales.map((sale) => this.toSaleView(sale));
  }

  private toSaleView(sale: BookingRetailSale): BookingRetailSaleView {
    return {
      id: sale.id,
      productId: sale.productId,
      productName: sale.product?.name ?? 'Product',
      quantity: sale.quantity,
      unitPrice: Number(sale.unitPrice),
      lineTotal: Number(sale.lineTotal),
    };
  }

  private sumLines(lines: BookingRetailSaleView[]): number {
    return roundMoney(lines.reduce((sum, line) => sum + line.lineTotal, 0));
  }

  private async findBooking(
    businessId: string,
    bookingId: string,
  ): Promise<Booking> {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId, businessId },
      relations: { service: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
