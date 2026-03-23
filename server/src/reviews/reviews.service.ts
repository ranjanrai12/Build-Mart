import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../auth/entities/user.entity';
import { Order, OrderStatus } from '../orders/entities/order.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private readonly reviewRepo: Repository<Review>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
  ) {}

  async createProductReview(buyerId: string, productId: string, rating: number, comment: string) {
    const buyer = await this.userRepo.findOne({ where: { id: buyerId } });
    const product = await this.productRepo.findOne({ where: { id: productId } });
    
    if (!buyer || !product) return null;

    // Check for verified purchase (delivered order containing this product)
    const deliveredOrder = await this.orderRepo.findOne({
      where: {
        buyerId,
        status: OrderStatus.DELIVERED,
        items: { product: { id: productId } }
      },
      relations: ['items', 'items.product']
    });

    const review = this.reviewRepo.create({
      buyer,
      product,
      rating,
      comment,
      verifiedPurchase: !!deliveredOrder
    });
    
    const saved = await this.reviewRepo.save(review);
    await this.updateProductRating(productId);
    return saved;
  }

  async createSellerReview(buyerId: string, sellerId: string, rating: number, comment: string) {
    const buyer = await this.userRepo.findOne({ where: { id: buyerId } });
    const seller = await this.userRepo.findOne({ where: { id: sellerId } });
    
    if (!buyer || !seller) return null;

    // Check for verified purchase from this seller
    const deliveredOrder = await this.orderRepo.findOne({
      where: {
        buyerId,
        sellerId,
        status: OrderStatus.DELIVERED
      }
    });

    const review = this.reviewRepo.create({
      buyer,
      seller,
      rating,
      comment,
      verifiedPurchase: !!deliveredOrder
    });
    
    const saved = await this.reviewRepo.save(review);
    await this.updateSellerRating(sellerId);
    return saved;
  }

  private async updateProductRating(productId: string) {
    const reviews = await this.reviewRepo.find({ where: { product: { id: productId } } });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await this.productRepo.update(productId, {
      rating: parseFloat(avgRating.toFixed(1)),
      reviewsCount: reviews.length
    });
  }

  private async updateSellerRating(sellerId: string) {
    const reviews = await this.reviewRepo.find({ where: { seller: { id: sellerId } } });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await this.userRepo.update(sellerId, {
      rating: parseFloat(avgRating.toFixed(1)),
      totalReviews: reviews.length
    });
  }

  async getProductReviews(productId: string) {
    return this.reviewRepo.find({
      where: { product: { id: productId } },
      relations: ['buyer'],
      order: { createdAt: 'DESC' },
    });
  }

  async getSellerReviews(sellerId: string) {
    return this.reviewRepo.find({
      where: { seller: { id: sellerId } },
      relations: ['buyer'],
      order: { createdAt: 'DESC' },
    });
  }
}
