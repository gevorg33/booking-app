import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../customer/entities/customer.entity.js';
import { Booking } from '../booking/entities/booking.entity.js';
import {
  collectContactCandidates,
  normalizeLoyaltyEmail,
  normalizeLoyaltyPhone,
} from './loyalty-contact.util.js';

export type LoyaltyCustomerMatchMethod =
  | 'booking_customer_id'
  | 'email'
  | 'phone'
  | 'email_and_phone';

export interface LoyaltyCustomerMatch {
  status: 'matched' | 'no_match' | 'ambiguous';
  customerId?: string;
  method?: LoyaltyCustomerMatchMethod;
  candidateCustomerIds?: string[];
  emails?: string[];
  phones?: string[];
  reason?: string;
}

@Injectable()
export class LoyaltyCustomerMatcherService {
  private readonly logger = new Logger(LoyaltyCustomerMatcherService.name);

  constructor(
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
  ) {}

  async resolveForBooking(booking: Booking): Promise<LoyaltyCustomerMatch> {
    if (booking.customerId) {
      const linked =
        booking.customer ??
        (await this.customerRepo.findOne({
          where: { id: booking.customerId, businessId: booking.businessId },
        }));
      if (linked?.isActive) {
        return {
          status: 'matched',
          customerId: linked.id,
          method: 'booking_customer_id',
        };
      }
    }

    const contacts = collectContactCandidates({
      customerEmail: booking.customer?.email,
      customerPhone: booking.customer?.phone,
      metadata: booking.metadata,
    });

    if (contacts.emails.length === 0 && contacts.phones.length === 0) {
      return { status: 'no_match', reason: 'missing_contact' };
    }

    const activeCustomers = await this.customerRepo.find({
      where: { businessId: booking.businessId, isActive: true },
    });

    const emailMatches = new Set<string>();
    const phoneMatches = new Set<string>();

    for (const customer of activeCustomers) {
      const email = normalizeLoyaltyEmail(customer.email);
      const phone = normalizeLoyaltyPhone(customer.phone);

      if (email && contacts.emails.includes(email)) {
        emailMatches.add(customer.id);
      }
      if (phone && contacts.phones.includes(phone)) {
        phoneMatches.add(customer.id);
      }
    }

    const union = new Set([...emailMatches, ...phoneMatches]);
    if (union.size === 0) {
      return {
        status: 'no_match',
        reason: 'no_customer_for_contact',
        emails: contacts.emails,
        phones: contacts.phones,
      };
    }

    if (union.size > 1) {
      const match = this.resolveMultipleCandidates(
        contacts.emails,
        contacts.phones,
        activeCustomers,
        emailMatches,
        phoneMatches,
      );
      if (match.status === 'matched') {
        return match;
      }

      const ambiguous: LoyaltyCustomerMatch = {
        status: 'ambiguous',
        candidateCustomerIds: [...union],
        emails: contacts.emails,
        phones: contacts.phones,
        reason: match.reason ?? 'multiple_customers',
      };
      this.logAmbiguous(booking, ambiguous);
      return ambiguous;
    }

    const customerId = [...union][0];
    let method: LoyaltyCustomerMatchMethod = 'email';
    if (emailMatches.has(customerId) && phoneMatches.has(customerId)) {
      method = 'email_and_phone';
    } else if (phoneMatches.has(customerId)) {
      method = 'phone';
    }

    return {
      status: 'matched',
      customerId,
      method,
      emails: contacts.emails,
      phones: contacts.phones,
    };
  }

  /** When email and phone match different records, only accept if they collapse to one id. */
  private resolveMultipleCandidates(
    emails: string[],
    phones: string[],
    customers: Customer[],
    emailMatches: Set<string>,
    phoneMatches: Set<string>,
  ): LoyaltyCustomerMatch {
    if (emailMatches.size === 1 && phoneMatches.size === 1) {
      const [emailId] = [...emailMatches];
      const [phoneId] = [...phoneMatches];
      if (emailId === phoneId) {
        return {
          status: 'matched',
          customerId: emailId,
          method: 'email_and_phone',
        };
      }
      return {
        status: 'ambiguous',
        reason: 'email_and_phone_different_customers',
        candidateCustomerIds: [emailId, phoneId],
      };
    }

    if (emailMatches.size === 1 && phones.length === 0) {
      return {
        status: 'matched',
        customerId: [...emailMatches][0],
        method: 'email',
      };
    }

    if (phoneMatches.size === 1 && emails.length === 0) {
      return {
        status: 'matched',
        customerId: [...phoneMatches][0],
        method: 'phone',
      };
    }

    return {
      status: 'ambiguous',
      reason: 'duplicate_customer_records',
      candidateCustomerIds: [...new Set([...emailMatches, ...phoneMatches])],
    };
  }

  private logAmbiguous(booking: Booking, match: LoyaltyCustomerMatch): void {
    this.logger.warn(
      JSON.stringify({
        event: 'loyalty_ambiguous_customer_match',
        bookingId: booking.id,
        businessId: booking.businessId,
        emails: match.emails ?? [],
        phones: match.phones ?? [],
        candidateCustomerIds: match.candidateCustomerIds ?? [],
        reason: match.reason,
      }),
    );
  }
}
