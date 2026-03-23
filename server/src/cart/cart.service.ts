import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem)
    private cartRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  private calculateUnitPrice(product: Product, quantity: number): number {
    if (!product.pricingTiers || product.pricingTiers.length === 0) {
      return Number(product.price);
    }

    // Ensure we handle potential string values from JSON storage
    const sortedTiers = [...product.pricingTiers].sort((a, b) => Number(b.minQty) - Number(a.minQty));
    const applicableTier = sortedTiers.find(tier => quantity >= Number(tier.minQty));

    return applicableTier ? Number(applicableTier.price) : Number(product.price);
  }

  async findAll(userId: string): Promise<any[]> {
    const items = await this.cartRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    const enrichedItems = await Promise.all(items.map(async item => {
      const product = await this.productRepository.findOne({ where: { id: item.productId } });
      
      // QA FIX: Recalculate price in real-time to handle seller price updates
      let currentPrice = item.price;
      if (product) {
        currentPrice = this.calculateUnitPrice(product, item.quantity);
        if (currentPrice !== item.price) {
          item.price = currentPrice;
          await this.cartRepository.save(item);
        }
      }

      return {
        ...item,
        price: currentPrice,
        originalPrice: product ? Number(product.price) : currentPrice
      };
    }));

    return enrichedItems;
  }

  async findOne(id: string, userId: string): Promise<CartItem> {
    const item = await this.cartRepository.findOne({ where: { id, userId } });
    if (!item) throw new NotFoundException('Cart item not found');
    return item;
  }

  async createOrUpdate(userId: string, itemData: any): Promise<CartItem> {
    const product = await this.productRepository.findOne({ where: { id: itemData.productId } });
    if (!product) throw new NotFoundException('Product not found');

    const existing = await this.cartRepository.findOne({
      where: { userId, productId: itemData.productId },
    });

    if (existing) {
      existing.quantity += itemData.quantity || 1;
      existing.price = this.calculateUnitPrice(product, existing.quantity);
      return this.cartRepository.save(existing) as any;
    }

    const quantity = itemData.quantity || 1;
    const price = this.calculateUnitPrice(product, quantity);
    const newItem = this.cartRepository.create({ 
      ...itemData, 
      userId, 
      quantity,
      price 
    });
    return this.cartRepository.save(newItem) as any;
  }

  async updateQuantity(id: string, userId: string, quantity: number): Promise<CartItem> {
    const item = await this.findOne(id, userId);
    const product = await this.productRepository.findOne({ where: { id: item.productId } });
    
    item.quantity = Math.max(1, quantity);
    if (product) {
      item.price = this.calculateUnitPrice(product, item.quantity);
    }
    
    return this.cartRepository.save(item);
  }

  async remove(id: string, userId: string): Promise<void> {
    const item = await this.findOne(id, userId);
    await this.cartRepository.remove(item);
  }

  async clear(userId: string): Promise<void> {
    await this.cartRepository.delete({ userId });
  }
}
