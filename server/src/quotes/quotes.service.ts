import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuoteRequest, QuoteStatus } from './entities/quote-request.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../auth/entities/user.entity';

import { OrdersService } from '../orders/orders.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class QuotesService {
  constructor(
    @InjectRepository(QuoteRequest) private readonly quoteRepo: Repository<QuoteRequest>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly ordersService: OrdersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll() {
    return this.quoteRepo.find({
      relations: ['product', 'buyer'],
      order: { createdAt: 'DESC' },
    });
  }

  async createQuoteRequest(buyerId: string, quoteData: any) {
    const { productId, quantity, notes } = quoteData;
    const buyer = await this.userRepo.findOne({ where: { id: buyerId } });
    const product = await this.productRepo.findOne({ where: { id: productId } });

    if (!buyer || !product) throw new NotFoundException('Buyer or Product not found');

    const quote = this.quoteRepo.create({
      buyer,
      product,
      quantity,
      notes,
      status: QuoteStatus.PENDING,
    });
    const savedQuote = await this.quoteRepo.save(quote);

    if (product.sellerId) {
      await this.notificationsService.create({
        recipientId: product.sellerId,
        title: "New B2B Inquiry",
        message: `${buyer.name} requested a quote for ${quantity}x ${product.name}.`,
        type: NotificationType.QUOTE_COUNTER,
        relatedId: savedQuote.id,
      });
    }

    return savedQuote;
  }


  async getBuyerQuotes(buyerId: string) {
    return this.quoteRepo.find({
      where: { buyer: { id: buyerId } },
      relations: ['product', 'buyer'],
      order: { createdAt: 'DESC' },
    });
  }

  async getSellerQuotes(sellerId: string) {
    // We use QueryBuilder to join products and filter by its sellerId
    return this.quoteRepo.createQueryBuilder('quote')
      .leftJoinAndSelect('quote.product', 'product')
      .leftJoinAndSelect('quote.buyer', 'buyer')
      .where('product.sellerId = :sellerId', { sellerId })
      .orderBy('quote.createdAt', 'DESC')
      .getMany();
  }

  async respondToQuote(quoteId: string, responseData: any) {
    const { offeredPrice, sellerNotes, validDays } = responseData;
    const quote = await this.quoteRepo.findOne({ 
      where: { id: quoteId },
      relations: ['product', 'buyer']
    });
    if (!quote) throw new NotFoundException('Quote request not found');

    if (quote.product && offeredPrice > quote.product.price) {
      throw new Error(`Counter-offer price (₹${offeredPrice}) cannot exceed original product price (₹${quote.product.price})`);
    }

    quote.offeredPrice = offeredPrice;
    quote.sellerNotes = sellerNotes;
    quote.status = QuoteStatus.RESPONDED;
    
    if (validDays) {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + validDays);
      quote.validUntil = expiry;
    }

    const savedQuote = await this.quoteRepo.save(quote);

    // Notify Buyer about Counter-Offer
    if (quote.buyer) {
      await this.notificationsService.create({
        recipientId: quote.buyer.id,
        title: 'New Counter Offer',
        message: `Seller has proposed ₹${offeredPrice} for ${quote.product?.name || 'your inquiry'}.`,
        type: NotificationType.QUOTE_COUNTER,
        relatedId: quote.id,
      });
    }

    return savedQuote;
  }

  async acceptQuote(quoteId: string, buyerId: string) {
    const quote = await this.quoteRepo.findOne({ 
      where: { id: quoteId, buyer: { id: buyerId } },
      relations: ['product', 'buyer']
    });
    if (!quote) throw new NotFoundException('Quote request not found');
    if (quote.status !== QuoteStatus.RESPONDED) {
      throw new Error('Quote must be in Responded status to be accepted');
    }

    await this.createOrderFromQuote(quote);

    quote.status = QuoteStatus.ACCEPTED;
    const savedQuote = await this.quoteRepo.save(quote);

    if (quote.product && quote.product.sellerId) {
      await this.notificationsService.create({
        recipientId: quote.product.sellerId,
        title: "Order Received!",
        message: `Buyer accepted your offer of ₹${quote.offeredPrice}. New order created.`,
        type: NotificationType.ORDER_PLACED,
        relatedId: quote.id,
      });
    }

    return savedQuote;
  }

  async acceptBySeller(quoteId: string) {
    const quote = await this.quoteRepo.findOne({ 
      where: { id: quoteId },
      relations: ['product', 'buyer']
    });
    if (!quote) throw new NotFoundException('Quote request not found');
    
    // Seller can only accept if it's Pending (Target Price)
    if (quote.status !== QuoteStatus.PENDING) {
      throw new Error('Can only accept target price for pending inquiries');
    }

    await this.createOrderFromQuote(quote);

    quote.status = QuoteStatus.ACCEPTED;
    const savedQuote = await this.quoteRepo.save(quote);

    if (quote.buyer) {
      await this.notificationsService.create({
        recipientId: quote.buyer.id,
        title: "Inquiry Approved!",
        message: `Seller accepted your target price for ${quote.product?.name}. Order created!`,
        type: NotificationType.QUOTE_ACCEPTED,
        relatedId: quote.id,
      });
    }

    return savedQuote;

  }

  private async createOrderFromQuote(quote: QuoteRequest) {
    const orderData = {
      items: [{
        productId: quote.product.id,
        quantity: quote.quantity,
        price: quote.offeredPrice || quote.product.price, // Uses target price fallback logic
        name: quote.product.name,
        sellerId: quote.product.sellerId,
      }],
      address: quote.buyer.location || 'Site Delivery',
      paymentMethod: 'Pay on Delivery',
      deliveryFee: 0,
    };

    return this.ordersService.createOrders(quote.buyer.id, orderData);
  }

  async rejectByBuyer(quoteId: string, buyerId: string) {
    const quote = await this.quoteRepo.findOne({ 
      where: { id: quoteId, buyer: { id: buyerId } },
      relations: ['product', 'buyer']
    });
    if (!quote) throw new NotFoundException('Quote request not found');
    quote.status = QuoteStatus.REJECTED_BY_BUYER;
    const savedQuote = await this.quoteRepo.save(quote);

    if (quote.product && quote.product.sellerId) {
      await this.notificationsService.create({
        recipientId: quote.product.sellerId,
        title: "Counter Offer Declined",
        message: `Buyer declined your firm offer of ₹${quote.offeredPrice} for ${quote.product.name}.`,
        type: NotificationType.QUOTE_DECLINED,
        relatedId: quote.id,
      });
    }

    return savedQuote;
  }

  async updateQuoteStatus(quoteId: string, status: QuoteStatus) {
    const quote = await this.quoteRepo.findOne({ 
      where: { id: quoteId },
      relations: ['product', 'buyer']
    });
    if (!quote) throw new NotFoundException('Quote request not found');
    quote.status = status;
    const savedQuote = await this.quoteRepo.save(quote);

    // Notify Buyer if Declined
    if (status === QuoteStatus.DECLINED && quote.buyer) {
      await this.notificationsService.create({
        recipientId: quote.buyer.id,
        title: 'Inquiry Declined',
        message: `Seller declined your procurement request for ${quote.product?.name}.`,
        type: NotificationType.QUOTE_DECLINED,
        relatedId: quote.id,
      });
    }

    return savedQuote;
  }
}
